import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const sharedWithMe = db.collection('shared_with_me');
    const lists = db.collection('lists');
    const users = db.collection('users');

    // Get all tokens shared with this user
    const entries = await sharedWithMe
      .find({ userId })
      .sort({ viewedAt: -1 })
      .toArray();

    if (entries.length === 0) {
      return res.status(200).json([]);
    }

    const tokens = entries.map(e => e.shareToken);
    
    // Fetch list details for these tokens
    const sharedLists = await lists
      .find({ shareToken: { $in: tokens } })
      .toArray();

    // Map creator names
    const creatorIds = [...new Set(sharedLists.map(l => l.userId))];
    const { ObjectId } = await import('mongodb');
    const creators = await users
      .find({ _id: { $in: creatorIds.map(id => new ObjectId(id)) } })
      .toArray();
    
    const creatorMap = Object.fromEntries(
      creators.map(u => [u._id.toString(), u.username])
    );

    // Combine data
    const result = entries.map(entry => {
      const list = sharedLists.find(l => l.shareToken === entry.shareToken);
      if (!list) return null;
      return {
        _id: list._id.toString(),
        name: list.name,
        shareToken: list.shareToken,
        createdAt: list.createdAt,
        ownerName: creatorMap[list.userId] || 'Unknown',
        viewedAt: entry.viewedAt
      };
    }).filter(Boolean);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching shared lists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
