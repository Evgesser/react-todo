import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

interface LoginResponse {
  userId: string;
  username: string;
}

interface ErrorResponse {
  error: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password } = req.body as { username?: unknown; password?: unknown };

  // Validate input
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  if (username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }
  if (password.length < 3) {
    res.status(400).json({ error: 'Password must be at least 3 characters' });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    const passwordHash = hashPassword(password);
    const normalizedUsername = username.trim().toLowerCase();

    // Try to find existing user
    let user = await users.findOne({ username: normalizedUsername });

    if (user) {
      // User exists, verify password
      if (user.passwordHash !== passwordHash) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }
    } else {
      // Create new user
      const newUser: User = {
        _id: new ObjectId(),
        username: normalizedUsername,
        passwordHash,
        createdAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = newUser;
      user._id = result.insertedId;
    }

    res.status(200).json({
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
