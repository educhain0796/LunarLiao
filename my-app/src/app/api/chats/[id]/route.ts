import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
    // Await the params promise to extract the id
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');

    if (!id) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 401 });
    }

    await dbConnect();

    try {
        const chat = await Chat.findById(id);
        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }
        if (chat.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(chat);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');

    if (!id) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 401 });
    }

    await dbConnect();

    try {
        const deleted = await Chat.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    const { title } = await req.json();

    if (!id) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 401 });
    }
    if (!title || typeof title !== 'string') {
        return NextResponse.json({ error: 'Valid title required' }, { status: 400 });
    }

    await dbConnect();

    try {
        const updated = await Chat.findOneAndUpdate(
            { _id: id, userId },
            { $set: { title: title.substring(0, 80), updatedAt: new Date() } },
            { new: true }
        );
        if (!updated) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, title: updated.title });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }
}
