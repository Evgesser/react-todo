import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

interface RegisterResponse {
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
  res: NextApiResponse<RegisterResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password, captchaAnswer } = req.body as { 
    username?: unknown; 
    password?: unknown;
    captchaAnswer?: unknown;
  };

  // Validate input
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }
  if (typeof captchaAnswer !== 'number') {
    res.status(400).json({ error: 'Captcha answer is required' });
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

  // Verify captcha (stored in session or calculated based on username)
  // For simplicity, we'll calculate it based on the username hash
  const captchaHash = crypto.createHash('md5').update(username.toLowerCase()).digest('hex');
  const num1 = parseInt(captchaHash.substring(0, 2), 16) % 50 + 1;
  const num2 = parseInt(captchaHash.substring(2, 4), 16) % 50 + 1;
  const expectedAnswer = num1 + num2;

  if (captchaAnswer !== expectedAnswer) {
    res.status(400).json({ error: 'Incorrect captcha answer' });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    const passwordHash = hashPassword(password);
    const normalizedUsername = username.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await users.findOne({ username: normalizedUsername });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Create new user
    const newUser: User = {
      _id: new ObjectId(),
      username: normalizedUsername,
      passwordHash,
      createdAt: new Date(),
    };
    const result = await users.insertOne(newUser);

    res.status(201).json({
      userId: result.insertedId.toString(),
      username: newUser.username,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
