import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = cached;
}

async function dbConnect() {
    console.log("🔌 dbConnect() called");
    
    if (cached.conn) {
        console.log("  - ✅ Using cached connection");
        console.log("  - Connection state:", mongoose.connection.readyState);
        return cached.conn;
    }

    if (!cached.promise) {
        console.log("  - 🔄 Creating new connection promise...");
        console.log("  - MongoDB URI:", MONGODB_URI ? `${MONGODB_URI.substring(0, 20)}...` : "❌ Missing");
        
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            console.log("  - ✅ Connection established");
            console.log("  - Database:", mongoose.connection.name);
            console.log("  - Host:", mongoose.connection.host);
            console.log("  - ReadyState:", mongoose.connection.readyState);
            return mongoose;
        }).catch((error) => {
            console.error("  - ❌ Connection promise rejected:");
            console.error("    - Error:", error?.message || error);
            throw error;
        });
    } else {
        console.log("  - ⏳ Waiting for existing connection promise...");
    }

    try {
        cached.conn = await cached.promise;
        console.log("  - ✅ Connection promise resolved");
    } catch (e: any) {
        console.error("  - ❌ Connection promise failed:");
        console.error("    - Error:", e?.message || e);
        console.error("    - Stack:", e?.stack?.substring(0, 200));
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
