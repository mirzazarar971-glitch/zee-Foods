import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

let memoryServer = null;

/**
 * Connects to MongoDB. When MONGO_URI (or MONGODB_URI) points to a reachable server it is used.
 * Otherwise the app boots an embedded MongoDB (mongodb-memory-server) with a
 * persistent data directory so the project runs out-of-the-box on a fresh PC.
 */
export async function connectDB() {
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();

  try {
    if (!uri) throw new Error('MONGO_URI/MONGODB_URI not set');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[db] connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
    return { source: 'external' };
  } catch (error) {
    if (uri) console.warn(`[db] external MongoDB unavailable (${error.message}); starting embedded database`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve('.data/mongo');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'zeefoods',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    await mongoose.connect(memoryServer.getUri(), { dbName: 'zeefoods' });
    console.log(`[db] embedded MongoDB running -> ${memoryServer.getUri()}`);
    console.log('[db] data persists in ./.data/mongo — set MONGO_URI to use Atlas or a local install.');
    return { source: 'embedded' };
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  memoryServer = null;
}

export default connectDB;
