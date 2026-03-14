import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByResetToken, resetUserPassword } from '../../../lib/mongodb';
import clientPromise from '../../../lib/mongodb';
import type { User } from '@/types/user';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password required' });
  }
  const user = await getUserByResetToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  const hash = hashPassword(password);
  await resetUserPassword(user._id, hash);
  // Сбросить счётчик попыток и блокировку
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection<User>('users');
  await users.updateOne(
    { _id: user._id },
    { $set: { resetTries: 0, resetBlockedUntil: 0 } }
  );
  res.status(200).json({ message: 'Password reset successful' });
}
