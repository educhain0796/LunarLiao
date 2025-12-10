import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, StreamData } from 'ai';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';

export const maxDuration = 30;

export async function POST(req: Request) {
    const startTime = Date.now();
    console.log("=".repeat(80));
    console.log("🚀 Chat API endpoint called at", new Date().toISOString());
    console.log("=".repeat(80));
    
    try {
        // Check environment variables
        console.log("📋 Environment Check:");
        console.log("  - MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing");
        console.log("  - GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "✅ Set" : "❌ Missing");
        
        const body = await req.json();
        const { messages, userId, id } = body;
        console.log("\n📥 Request Details:");
        console.log("  - Full body:", JSON.stringify(body, null, 2));
        console.log("  - userId:", userId || "❌ Not provided");
        console.log("  - chatId:", id || "New chat");
        console.log("  - messages type:", typeof messages);
        console.log("  - messages is array:", Array.isArray(messages));
        console.log("  - messageCount:", messages?.length || 0);
        console.log("  - messages value:", messages);
        console.log("  - lastMessage:", messages?.[messages.length - 1]?.content?.substring(0, 50) || "N/A");

        if (!userId) {
            console.error("❌ Unauthorized: No userId provided");
            return new Response(JSON.stringify({ error: 'Unauthorized: No userId provided' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.error("❌ Invalid messages:", messages);
            return new Response(JSON.stringify({ 
                error: 'Invalid request: messages must be a non-empty array',
                received: messages
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate message structure
        const invalidMessages = messages.filter((msg: any) => !msg || !msg.role || !msg.content);
        if (invalidMessages.length > 0) {
            console.error("❌ Invalid message structure:", invalidMessages);
            return new Response(JSON.stringify({ 
                error: 'Invalid message structure: each message must have role and content',
                invalidMessages: invalidMessages
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let chatObjectId = id;
        let dbConnected = false;
        let dbConnectionDetails: any = {};

        // MongoDB Connection Check
        console.log("\n🗄️  MongoDB Connection:");
        try {
            console.log("  - Attempting connection...");
            const connectionStart = Date.now();
            await dbConnect();
            const connectionTime = Date.now() - connectionStart;
            
            dbConnected = mongoose.connection.readyState === 1;
            dbConnectionDetails = {
                readyState: mongoose.connection.readyState,
                readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                connectionTime: `${connectionTime}ms`
            };
            
            console.log("  - Status:", dbConnected ? "✅ Connected" : "❌ Not connected");
            console.log("  - ReadyState:", dbConnectionDetails.readyStateText);
            console.log("  - Database:", dbConnectionDetails.name || "N/A");
            console.log("  - Host:", dbConnectionDetails.host || "N/A");
            console.log("  - Connection Time:", dbConnectionDetails.connectionTime);
        } catch (dbError: any) {
            dbConnected = false;
            console.error("  - ❌ Connection failed!");
            console.error("  - Error:", dbError?.message || dbError);
            console.error("  - Stack:", dbError?.stack?.substring(0, 200));
            console.log("  - ⚠️  Proceeding in offline mode");
        }

        // Convert messages to Vercel AI SDK Core format
        console.log("\n💬 Message Conversion:");
        console.log("  - Input messages:", JSON.stringify(messages, null, 2));
        let coreMessages;
        try {
            // First try convertToCoreMessages
            coreMessages = convertToCoreMessages(messages);
            console.log("  - ✅ convertToCoreMessages successful");
            console.log("  - Core messages count:", coreMessages?.length || 0);
            
            // Validate the result
            if (!coreMessages || !Array.isArray(coreMessages) || coreMessages.length === 0) {
                console.warn("  - ⚠️  convertToCoreMessages returned invalid result, formatting manually");
                // Fallback: manually format messages
                coreMessages = messages.map((msg: any) => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
                }));
                console.log("  - ✅ Manual formatting successful");
            }
            
            console.log("  - First message role:", coreMessages[0]?.role);
            console.log("  - Last message role:", coreMessages[coreMessages.length - 1]?.role);
            console.log("  - Core messages:", JSON.stringify(coreMessages, null, 2));
        } catch (conversionError: any) {
            console.error("  - ❌ Conversion failed, trying manual format:");
            console.error("    - Error:", conversionError?.message || conversionError);
            console.error("    - Stack:", conversionError?.stack?.substring(0, 300));
            
            // Fallback: manually format messages
            try {
                coreMessages = messages.map((msg: any) => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
                }));
                console.log("  - ✅ Manual formatting successful as fallback");
            } catch (manualError: any) {
                console.error("  - ❌ Manual formatting also failed:", manualError);
                return new Response(JSON.stringify({ 
                    error: 'Failed to convert messages',
                    message: conversionError?.message || 'Unknown conversion error'
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Chat Creation/Retrieval
        if (dbConnected) {
            try {
                if (!chatObjectId) {
                    console.log("\n📝 Creating new chat in MongoDB...");
                    const newChat = await Chat.create({
                        userId,
                        title: messages[0]?.content.substring(0, 50) || 'New Chat',
                        messages: []
                    });
                    chatObjectId = newChat._id.toString();
                    console.log("  - ✅ New chat created:", chatObjectId);
                    console.log("  - Chat title:", newChat.title);
                } else {
                    console.log("\n📖 Fetching existing chat from MongoDB...");
                    const existingChat = await Chat.findById(chatObjectId);
                    if (existingChat) {
                        console.log("  - ✅ Chat found:", chatObjectId);
                        console.log("  - Chat title:", existingChat.title);
                        console.log("  - Existing messages:", existingChat.messages.length);
                    } else {
                        console.log("  - ⚠️  Chat not found, will create new one");
                    }
                }
            } catch (chatError: any) {
                console.error("\n❌ Chat operation failed:");
                console.error("  - Error:", chatError?.message || chatError);
                console.error("  - Stack:", chatError?.stack?.substring(0, 200));
                chatObjectId = chatObjectId || Date.now().toString();
                dbConnected = false;
                console.log("  - ⚠️  Using fallback chatId:", chatObjectId);
            }
        } else {
            chatObjectId = chatObjectId || Date.now().toString();
            console.log("\n📝 Using offline mode chatId:", chatObjectId);
        }

        // Validate coreMessages before passing to streamText
        if (!coreMessages || !Array.isArray(coreMessages) || coreMessages.length === 0) {
            console.error("\n❌ Invalid coreMessages after conversion:");
            console.error("  - coreMessages:", coreMessages);
            console.error("  - type:", typeof coreMessages);
            console.error("  - isArray:", Array.isArray(coreMessages));
            return new Response(JSON.stringify({ 
                error: 'Failed to convert messages to valid format',
                details: 'coreMessages is invalid or empty'
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate each message has required properties
        const invalidCoreMessages = coreMessages.filter((msg: any) => {
            return !msg || 
                   !msg.role || 
                   (msg.content === undefined && msg.content !== null && !msg.parts);
        });
        
        if (invalidCoreMessages.length > 0) {
            console.error("\n❌ Invalid coreMessages structure:");
            console.error("  - Invalid messages:", JSON.stringify(invalidCoreMessages, null, 2));
            return new Response(JSON.stringify({ 
                error: 'Invalid message structure in coreMessages',
                details: 'Some messages are missing required properties'
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Google AI API Call
        console.log("\n🤖 Google AI API:");
        console.log("  - Model: gemini-1.5-flash");
        console.log("  - Core messages to send:", JSON.stringify(coreMessages, null, 2));
        console.log("  - Starting streamText...");
        
        const aiStartTime = Date.now();
        let streamStarted = false;
        let streamFinished = false;
        let streamError: any = null;

        // Log final message structure before streamText
        console.log("  - Final messages structure check:");
        coreMessages.forEach((msg: any, idx: number) => {
            console.log(`    [${idx}] role: ${msg.role}, content type: ${typeof msg.content}, has content: ${!!msg.content}`);
        });

        let result;
        try {
            console.log("  - Calling streamText...");
            result = streamText({
            model: google('gemini-1.5-flash'),
            system: `You are a mystical and wise astrological assistant named "Lunar AI" for the app "Lunar Liao". 
               You provide insights on horoscopes, zodiac signs, and daily predictions. 
               Your tone is empathetic, mysterious, yet helpful and grounded. 
               Keep responses concise but engaging. Use emojis related to stars and cosmos occasionally.`,
            messages: coreMessages,
            onStart: () => {
                streamStarted = true;
                const aiTime = Date.now() - aiStartTime;
                console.log("  - ✅ Stream started (took", aiTime, "ms)");
                console.log("  - Starting to receive AI response...");
            },
            onChunk: ({ chunk }) => {
                // Log chunks as they come in (optional, can be verbose)
                if (chunk && typeof chunk === 'object' && 'type' in chunk) {
                    console.log("  - 📦 Chunk received:", chunk.type);
                }
            },
            onFinish: async ({ text, finishReason, usage }) => {
                streamFinished = true;
                const aiTime = Date.now() - aiStartTime;
                console.log("\n✨ Stream Finished:");
                console.log("  - Finish reason:", finishReason);
                console.log("  - Response length:", text?.length || 0, "characters");
                console.log("  - Usage:", JSON.stringify(usage, null, 2));
                console.log("  - Total AI time:", aiTime, "ms");
                console.log("\n🤖 AI Response (Full Text):");
                console.log("=".repeat(80));
                console.log(text);
                console.log("=".repeat(80));
                
                if (!dbConnected) {
                    console.log("  - ⚠️  DB offline, skipping save to MongoDB");
                    return;
                }
                
                console.log("  - 💾 Saving to MongoDB...");
                try {
                    const userMsg = messages[messages.length - 1];
                    const newMessages = [
                        { role: 'user', content: userMsg.content },
                        { role: 'assistant', content: text }
                    ];

                    const saveStart = Date.now();
                    await Chat.findByIdAndUpdate(chatObjectId, {
                        $push: { messages: { $each: newMessages } },
                        $set: { updatedAt: new Date() }
                    });
                    const saveTime = Date.now() - saveStart;
                    console.log("  - ✅ Message saved to DB (took", saveTime, "ms)");
                } catch (dbError: any) {
                    console.error("  - ❌ Failed to save message:");
                    console.error("    - Error:", dbError?.message || dbError);
                    console.error("    - Stack:", dbError?.stack?.substring(0, 200));
                }
            },
            onError: (error) => {
                streamError = error;
                console.error("\n❌ Stream Error:");
                console.error("  - Error:", error?.message || error);
                console.error("  - Stack:", error?.stack?.substring(0, 300));
            },
            });
            console.log("  - ✅ streamText called successfully");
            console.log("  - Result type:", typeof result);
        } catch (streamTextError: any) {
            console.error("\n❌ streamText call failed:");
            console.error("  - Error:", streamTextError?.message || streamTextError);
            console.error("  - Stack:", streamTextError?.stack?.substring(0, 300));
            throw streamTextError;
        }

        console.log("\n📤 Preparing data stream response");
        console.log("  - Result type:", typeof result);
        console.log("  - Result constructor:", result?.constructor?.name);
        console.log("  - Result keys:", result ? Object.keys(result) : "result is null/undefined");
        console.log("  - Has toDataStreamResponse:", typeof result?.toDataStreamResponse === 'function');
        console.log("  - Has toAIStreamResponse:", typeof result?.toAIStreamResponse === 'function');
        console.log("  - Has textStream:", typeof result?.textStream === 'object');
        
        const totalTime = Date.now() - startTime;
        console.log("  - Total request time so far:", totalTime, "ms");
        console.log("=".repeat(80));
        
        // Check if toDataStreamResponse exists
        if (typeof result?.toDataStreamResponse === 'function') {
            console.log("  - Using toDataStreamResponse()");
            return result.toDataStreamResponse({
                headers: {
                    'X-Chat-Id': chatObjectId,
                    'X-Lunar-Offline': dbConnected ? 'false' : 'true',
                    'X-DB-Status': dbConnected ? 'connected' : 'offline',
                    'X-Request-Time': totalTime.toString()
                }
            });
        } else if (typeof result?.toAIStreamResponse === 'function') {
            console.log("  - Using toAIStreamResponse()");
            return result.toAIStreamResponse({
                headers: {
                    'X-Chat-Id': chatObjectId,
                    'X-Lunar-Offline': dbConnected ? 'false' : 'true',
                    'X-DB-Status': dbConnected ? 'connected' : 'offline',
                    'X-Request-Time': totalTime.toString()
                }
            });
        } else if (result?.textStream) {
            console.log("  - Using textStream to create response");
            // Fallback: create a streaming response manually
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        for await (const chunk of result.textStream) {
                            controller.enqueue(new TextEncoder().encode(chunk));
                        }
                        controller.close();
                    } catch (error) {
                        controller.error(error);
                    }
                }
            });
            
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Chat-Id': chatObjectId,
                    'X-Lunar-Offline': dbConnected ? 'false' : 'true',
                    'X-DB-Status': dbConnected ? 'connected' : 'offline',
                    'X-Request-Time': totalTime.toString()
                }
            });
        } else {
            console.error("  - ❌ No valid response method found on result");
            console.error("  - Result:", JSON.stringify(result, null, 2).substring(0, 500));
            throw new Error('streamText result does not have toDataStreamResponse, toAIStreamResponse, or textStream');
        }
    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error("\n" + "=".repeat(80));
        console.error("❌ Chat API Error:");
        console.error("  - Error:", error?.message || error);
        console.error("  - Type:", error?.constructor?.name || typeof error);
        console.error("  - Stack:", error?.stack || "No stack trace");
        console.error("  - Request time:", totalTime, "ms");
        console.error("=".repeat(80));
        
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error',
            message: error?.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
