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
 * Delete user account and all associated data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ error: 'Password is required to delete account' });
    return;
  }

  try {
    const { ObjectId } = await import('mongodb');
    const crypto = await import('crypto');
    
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection<User>('users');

    // Find user and verify password
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify password before deletion
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== passwordHash) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Delete user
    await users.deleteOne({ _id: new ObjectId(userId) });

    // Delete all user's data (lists, todos, etc.)
    const lists = db.collection('lists');
    const todos = db.collection('todos');

    // Get all user's lists IDs
    const userLists = await lists.find({ userId: new ObjectId(userId) }).toArray();
    const listIds = userLists.map(l => l._id);

    // Delete todos for these lists
    if (listIds.length > 0) {
      await todos.deleteMany({ listId: { $in: listIds } });
    }

    // Delete user's lists
    await lists.deleteMany({ userId: new ObjectId(userId) });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
