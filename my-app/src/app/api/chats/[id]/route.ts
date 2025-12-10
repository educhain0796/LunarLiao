import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
    // Await the params promise to extract the id
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    await dbConnect();

    try {
        const chat = await Chat.findById(id);
        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
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

    if (!id) {
        return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    await dbConnect();

    try {
        const deleted = await Chat.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}
