import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextApiRequest } from 'next';

interface BruteForceRecord {
  _id: ObjectId;
  ipAddress: string;
  username?: string;
  attempts: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
}

const ATTEMPT_LIMIT = 5; // Maximum attempts
const WINDOW_MINUTES = 15; // Time window in minutes
const CLEANUP_HOURS = 1; // Auto cleanup old records after 1 hour

type QueryFilter = {
  ipAddress: string;
  username?: string;
};

/**
 * Check if an IP/username combination is rate-limited
 */
export async function checkBruteForce(
  ipAddress: string,
  username?: string
): Promise<{ allowed: boolean; attemptsLeft?: number; blockedUntil?: Date }> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const attempts = db.collection<BruteForceRecord>('bruteForceAttempts');

    // Build query - check by IP and optionally by username
    const query: QueryFilter = { ipAddress };
    if (username) {
      query.username = username.toLowerCase();
    }

    // Get record with attempts in the current window
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const record = await attempts.findOne({
      ...query,
      lastAttemptAt: { $gte: windowStart },
    });

    if (!record) {
      return { allowed: true };
    }

    const attemptCount = record.attempts;
    const blockedUntil = new Date(record.lastAttemptAt.getTime() + WINDOW_MINUTES * 60 * 1000);

    if (attemptCount >= ATTEMPT_LIMIT) {
      return { allowed: false, blockedUntil };
    }

    return { allowed: true, attemptsLeft: ATTEMPT_LIMIT - attemptCount };
  } catch (error) {
    console.error('Brute force check error:', error);
    // On error, allow the attempt but log it
    return { allowed: true };
  }
}

/**
 * Record a failed login/register attempt
 */
export async function recordFailedAttempt(ipAddress: string, username?: string): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const attempts = db.collection<BruteForceRecord>('bruteForceAttempts');

    const query: QueryFilter = { ipAddress };
    if (username) {
      query.username = username.toLowerCase();
    }

    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

    // Find or create record
    const updateResult = await attempts.updateOne(
      {
        ...query,
        lastAttemptAt: { $gte: windowStart },
      },
      {
        $inc: { attempts: 1 },
        $set: { lastAttemptAt: new Date() },
      }
    );

    if (updateResult.matchedCount === 0) {
      // No recent attempt found, create new record
      await attempts.insertOne({
        _id: new ObjectId(),
        ipAddress,
        ...(username && { username: username.toLowerCase() }),
        attempts: 1,
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date(),
      } as BruteForceRecord);
    }

    // Cleanup old records (older than CLEANUP_HOURS)
    const cleanupThreshold = new Date(Date.now() - CLEANUP_HOURS * 60 * 60 * 1000);
    await attempts.deleteMany({
      lastAttemptAt: { $lt: cleanupThreshold },
    });
  } catch (error) {
    console.error('Failed to record attempt:', error);
  }
}

/**
 * Clear failed attempts for successful login/registration
 */
export async function clearAttempts(ipAddress: string, username?: string): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const attempts = db.collection<BruteForceRecord>('bruteForceAttempts');

    const query: QueryFilter = { ipAddress };
    if (username) {
      query.username = username.toLowerCase();
    }

    await attempts.deleteOne(query);
  } catch (error) {
    console.error('Failed to clear attempts:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}
