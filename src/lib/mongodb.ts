export async function setResetTriesAndBlock(userId: ObjectId, tries: number, blockedUntil?: number) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  const update: any = { resetTries: tries };
  if (blockedUntil) update.resetBlockedUntil = blockedUntil;
  else update.resetBlockedUntil = undefined;
  await users.updateOne(
    { _id: userId },
    { $set: update }
  );
}
export async function setResetLastSentAt(userId: ObjectId, ts: number) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  await users.updateOne(
    { _id: userId },
    { $set: { resetLastSentAt: ts } }
  );
}
import { MongoClient } from 'mongodb';

if (!process.env.taskLists_MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const uri = process.env.taskLists_MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;


import type { User } from '@/types/user';
import { ObjectId } from 'mongodb';

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  return users.findOne({ email });
}

export async function setResetToken(userId: ObjectId, token: string, expires: number) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  await users.updateOne(
    { _id: userId },
    { $set: { resetToken: token, resetTokenExpires: expires } }
  );
}

export async function getUserByResetToken(token: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  return users.findOne({ resetToken: token });
}

export async function resetUserPassword(userId: ObjectId, passwordHash: string) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  await users.updateOne(
    { _id: userId },
    { $set: { passwordHash }, $unset: { resetToken: '', resetTokenExpires: '' } }
  );
}
