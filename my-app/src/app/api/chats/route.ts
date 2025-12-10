import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 401 });
    }

    await dbConnect();

    try {
        // Return list of chats with message count, sorted by newest updated
        const chats = await Chat.aggregate([
            { $match: { userId } },
            {
                $project: {
                    title: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    messageCount: { $size: { $ifNull: ["$messages", []] } }
                }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 50 }
        ]);

        return NextResponse.json(chats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { userId, title } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 401 });
    }

    await dbConnect();

    try {
        const chat = await Chat.create({
            userId,
            title: title || 'New Chat',
            messages: []
        });

        return NextResponse.json(chat);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
