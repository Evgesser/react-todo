import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import type { User } from '@/types/user';

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  message: string;
}

/**
 * Change user password
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 3) {
    res.status(400).json({ error: 'New password must be at least 3 characters' });
    return;
  }

  try {
    const { ObjectId } = await import('mongodb');
    const crypto = await import('crypto');

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    // Find user and verify current password
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    if (user.passwordHash !== currentPasswordHash) {
      res.status(401).json({ error: 'Invalid current password' });
      return;
    }

    // Hash new password and update
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
