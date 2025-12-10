import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    createdAt: Date;
}

export interface IChat extends Document {
    userId: string;
    title: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, default: 'New Chat' },
        messages: [MessageSchema],
    },
    {
        timestamps: true,
    }
);

// Prevent overwrite during hot reload
export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
