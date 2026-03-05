import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import type { User } from '@/types/user';
import crypto from 'crypto';
import { checkBruteForce, recordFailedAttempt, clearAttempts, getClientIp } from '@/lib/bruteForceProtection';

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

  // Check brute force protection
  const clientIp = getClientIp(req);
  const bruteForceCheck = await checkBruteForce(clientIp, username.trim().toLowerCase());

  if (!bruteForceCheck.allowed) {
    res.status(429).json({ error: `Too many login attempts. Try again later.` });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    const passwordHash = hashPassword(password);
    const normalizedUsername = username.trim().toLowerCase();

    // Try to find existing user
    const user = await users.findOne({ username: normalizedUsername });

    if (!user) {
      // User doesn't exist
      await recordFailedAttempt(clientIp, normalizedUsername);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // User exists, verify password
    if (user.passwordHash !== passwordHash) {
      await recordFailedAttempt(clientIp, normalizedUsername);
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Success - clear attempts
    await clearAttempts(clientIp, normalizedUsername);

    // If client provided preferred language, set cookie so SSR can read it
    const { language } = req.body as { language?: unknown };
    if (typeof language === 'string' && (language === 'ru' || language === 'en' || language === 'he')) {
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.setHeader(
        'Set-Cookie',
        `language=${encodeURIComponent(language)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
      );
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
