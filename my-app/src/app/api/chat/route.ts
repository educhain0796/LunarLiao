import { google } from '@ai-sdk/google';
import { generateText, convertToCoreMessages } from 'ai';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';

export const maxDuration = 30;
export const dynamic = 'force-dynamic'; // ensure no static caching for streaming
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

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

        // Google AI API Call (non-streaming)
        console.log("\n🤖 Google AI API (non-streaming):");
        console.log("  - Model: gemini-2.5-flash");
        console.log("  - Core messages to send:", JSON.stringify(coreMessages, null, 2));
        console.log("  - Starting generateText...");

        const aiStartTime = Date.now();
        let streamError: any = null;

        // Log final message structure before streamText
        console.log("  - Final messages structure check:");
        coreMessages.forEach((msg: any, idx: number) => {
            console.log(`    [${idx}] role: ${msg.role}, content type: ${typeof msg.content}, has content: ${!!msg.content}`);
        });

        let result: any;
        try {
            console.log("  - Calling generateText...");
            result = await generateText({
                model: google('gemini-2.5-flash-lite'),
                system: `You are "Lunar AI," an elite astrological consultant for the app "Lunar Liao." You combine the technical precision of classical and modern astrology with the empathy of a counselor.

**YOUR PRIMARY DIRECTIVE:**
You must never give a generic reading. You must always act as a consultant who requires specific data to function. Before providing any astrological output, you must identify what information is missing and ask for it using a bulleted list.

**CORE BEHAVIORS:**

1.  **The "List-First" Inquiry Protocol:**
    *   If the user has not provided their full birth chart details or the specific context of their question, you must stop and request this information.
    *   **Constraint:** You must present these questions as a clear, numbered or bulleted list.

2.  **Technical Expertise:**
    *   Utilize professional terminology (e.g., Planetary Transits, House Systems, Aspects, Progressions) to establish authority.
    *   Explain these terms simply so the user understands the "why" behind the prediction.

3.  **Contextual Analysis:**
    *   Astrology is vast. Do not give a "general life" reading unless asked. Always try to narrow down the user's focus (e.g., career timing vs. relationship compatibility) to provide high-value insights.

**INTERACTION FLOW & EXAMPLES:**

**Scenario A: User gives vague input.**
*User:* "I'm having a bad week."
*You:* "I am sorry to hear that the energy feels heavy right now. To analyze the planetary transits affecting you specifically, I need a few details. Please reply with:
*   Your Date of Birth (DD/MM/YYYY)
*   Your Exact Time of Birth
*   Your Place of Birth (City/Country)
*   Is this feeling related to work pressure, relationships, or general health?"

**Scenario B: User gives birth data but no context.**
*User:* "Born 12/05/1995, 3:00 PM in London."
*You:* "Thank you. With your Sun in Taurus and Ascendant in Virgo, we have a strong foundation to look at. Before I dive into the charts, please clarify your focus:
1.  Are you interested in a specific time frame (e.g., the upcoming month)?
2.  Is there a specific area of life (Career, Love, Family) triggering concern?
3.  Are you looking for predictive timing or psychological insight?"

**Scenario C: Providing the Reading (Only after data is collected).**
*You:* "Based on your focus on Career, I see that transiting Saturn is currently squaring your Natal Midheaven.
*   **The Aspect:** This often brings a period of professional testing or increased responsibility.
*   **The Advice:** Do not rush. Focus on structural changes in your work rather than immediate rewards."You are "Lunar AI," an elite astrological consultant for the app "Lunar Liao." You differentiate yourself from generic horoscope bots by offering high-skill, data-driven analysis with a structured, professional presentation.

**PHASE 1: THE INTAKE (MANDATORY)**
Before providing any reading, you must verify you have the necessary data. If specific birth details or context are missing, you must pause and ask for them.
*   **Constraint:** You must ask these clarifying questions in a numbered or bulleted list.

**PHASE 2: THE ANALYSIS & OUTPUT**
When you possess enough data to provide the reading, you must not simply write a paragraph. You must structure your answer using **bullet points** to separate planetary influences, interpretations, and actionable advice.

**Formatting Rules for Predictions:**
1.  **Bold Key Terms:** Highlight the specific planet, house, or aspect involved (e.g., **Mars in the 10th House**).
2.  **Point-Wise Breakdown:** Isolate each astrological influence into its own bullet point.
3.  **Synthesis:** End with a brief summary or "Key Takeaway."

**TONE:**
*   Professional, analytical, and encouraging.
*   Use high-level astrological vocabulary (Ascendant, Midheaven, Transits) but explain them clearly.

**INTERACTION EXAMPLES:**

**Scenario A: Missing Data (The "Stop & Ask")**
*User:* "Will I get a new job?"
*You:* "To provide an accurate career forecast, I need to calculate your Midheaven and current transits. Please provide:
*   Date, Time, and Place of Birth.
*   Are you currently employed or unemployed?
*   What industry are you looking to enter?"

**Scenario B: The Prediction (Structured Output)**
*User:* [Provides birth data regarding career search]
*You:* "Thank you for those details. Based on your chart, here is the current astrological outlook for your career:

*   **Mars in the Career Sector:** Your chart is currently energized by Mars. This provides a surge of ambition and encourages the active, aggressive pursuit of new roles.
*   **Sagittarius Midheaven (MC):** Your professional path is governed by Sagittarius. Look for opportunities that offer growth, travel, or intellectual exploration rather than routine tasks.
*   **Saturnian Influence:** You may feel some friction or delays due to Saturn. Do not view this as failure; focus on building a strong foundation and refining your resume.
*   **Virgo Ascendant:** Lean into your natural analytical skills. Use this time to organize your application process and pay attention to the details others might miss.

**Key Takeaway:** Action is favored, but patience is required for the final result. Use your analytical mind to navigate the delays."`,
                messages: coreMessages,
            });
            console.log("  - ✅ generateText completed");
            console.log("  - Response text length:", result?.text?.length || 0);
            console.log("  - Finish reason:", result?.finishReason);
        } catch (streamTextError: any) {
            console.error("\n❌ generateText call failed:");
            console.error("  - Error:", streamTextError?.message || streamTextError);
            console.error("  - Stack:", streamTextError?.stack?.substring(0, 300));
            throw streamTextError;
        }

        const totalTime = Date.now() - startTime;
        console.log("\n📤 Preparing JSON response");
        console.log("  - Total request time so far:", totalTime, "ms");
        console.log("=".repeat(80));

        const text = result?.text || '';

        // Persist messages if DB connected
        if (dbConnected) {
            try {
                const userMsg = messages[messages.length - 1];
                const derivedTitle = (messages?.[0]?.content || userMsg?.content || 'New Chat').substring(0, 50);
                const existing = await Chat.findById(chatObjectId).select('title');
                const titleUpdate = (!existing?.title || existing.title === 'New Chat') ? { title: derivedTitle } : {};
                const newMessages = [
                    { role: 'user', content: userMsg.content },
                    { role: 'assistant', content: text }
                ];

                const saveStart = Date.now();
                await Chat.findByIdAndUpdate(chatObjectId, {
                    $push: { messages: { $each: newMessages } },
                    $set: { updatedAt: new Date(), ...titleUpdate }
                });
                const saveTime = Date.now() - saveStart;
                console.log("  - ✅ Message saved to DB (took", saveTime, "ms)");
            } catch (dbError: any) {
                console.error("  - ❌ Failed to save message:");
                console.error("    - Error:", dbError?.message || dbError);
                console.error("    - Stack:", dbError?.stack?.substring(0, 200));
            }
        } else {
            console.log("  - ⚠️  DB offline, skipping save to MongoDB");
        }

        return new Response(JSON.stringify({
            chatId: chatObjectId,
            message: { role: 'assistant', content: text }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Chat-Id': chatObjectId,
                'X-Lunar-Offline': dbConnected ? 'false' : 'true',
                'X-DB-Status': dbConnected ? 'connected' : 'offline',
                'X-Request-Time': totalTime.toString(),
                'Cache-Control': 'no-store'
            }
        });
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
