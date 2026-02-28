import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import type { User } from '@/types/user';

interface ProfileResponse {
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Get user profile by userId
 */
async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { ObjectId } = await import('mongodb');
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    return await users.findOne({ _id: new ObjectId(userId) });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Handle GET and PUT requests for user profile
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileResponse | ErrorResponse>
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const user = await getUserProfile(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { email, bio, avatar } = req.body as {
        email?: string;
        bio?: string;
        avatar?: string;
      };

      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate bio length
      if (bio && bio.length > 500) {
        res.status(400).json({ error: 'Bio must be 500 characters or less' });
        return;
      }

      // Validate avatar (should be a base64 string or URL)
      if (avatar && avatar.length > 1000000) {
        res.status(400).json({ error: 'Avatar is too large' });
        return;
      }

      const { ObjectId } = await import('mongodb');
      const client = await clientPromise;
      const db = client.db();
      const users = db.collection<User>('users');

      const updateData: Partial<User> = {
        updatedAt: new Date(),
      };

      if (email !== undefined) updateData.email = email;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar !== undefined) updateData.avatar = avatar;

      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );

      // Fetch updated user
      const updatedUser = await users.findOne({ _id: new ObjectId(userId) });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = updatedUser;
      res.status(200).json({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
