import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface ShoppingList {
  _id: ObjectId;
  userId: string;
  name: string;
  completed: boolean;
  createdAt: Date;
  finishedAt?: Date;
  defaultColor?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const lists = db.collection('lists');
  const items = db.collection('todos');

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    let existingLists = await lists.find({ userId }).toArray();

    res.status(200).json(existingLists);
  } else if (req.method === 'POST') {
    const { userId, name, defaultColor } = req.body as {
      userId?: unknown;
      name?: unknown;
      defaultColor?: unknown;
    };
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const newList: any = {
      userId,
      name,
      completed: false,
      createdAt: new Date(),
      defaultColor: typeof defaultColor === 'string' ? defaultColor : '#ffffff',
    };
    const result = await lists.insertOne(newList);
    res.status(201).json({ _id: result.insertedId, ...newList });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
