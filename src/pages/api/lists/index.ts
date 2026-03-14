import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const lists = db.collection('lists');
  

  if (req.method === 'GET') {
    const { userId, type } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    const allowedTypes = ['shopping', 'expenses', 'todo'];

    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const filter: Record<string, unknown> = { userId };
    if (type && typeof type === 'string' && allowedTypes.includes(type)) {
      // Keep backwards compatibility: existing lists without a type are treated as 'shopping'
      if (type === 'shopping') {
        filter.$or = [{ type: 'shopping' }, { type: { $exists: false } }];
      } else {
        filter.type = type;
      }
    }

    const existingLists = await lists.find(filter).toArray();

    res.status(200).json(existingLists);
  } else if (req.method === 'POST') {
    const { userId, name, defaultColor, type } = req.body as {
      userId?: unknown;
      name?: unknown;
      defaultColor?: unknown;
      type?: unknown;
    };
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const allowedTypes = ['shopping', 'expenses', 'todo'];
    const selectedType = typeof type === 'string' && allowedTypes.includes(type) ? type : 'shopping';

    interface NewList {
      userId: string;
      name: string;
      completed: boolean;
      createdAt: Date;
      defaultColor: string;
      type: string;
      shareToken?: string;
    }
    const newList: NewList = {
      userId,
      name,
      completed: false,
      createdAt: new Date(),
      defaultColor: typeof defaultColor === 'string' ? defaultColor : '#ffffff',
      type: selectedType,
    };
    // allow client to supply an initial shareToken (rare)
    const body = req.body as { shareToken?: unknown };
    if (typeof body.shareToken === 'string' && body.shareToken.trim() !== '') {
      newList.shareToken = body.shareToken.trim();
    }
    const result = await lists.insertOne(newList);
    res.status(201).json({ _id: result.insertedId, ...newList });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
