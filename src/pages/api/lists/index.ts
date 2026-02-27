import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export interface ShoppingList {
  _id: ObjectId;
  password: string;
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
  const items = db.collection('todos'); // items stay in same collection

  if (req.method === 'GET') {
    const { password } = req.query;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password query parameter is required' });
      return;
    }
    let existingLists = await lists.find({ password }).toArray();
    if (existingLists.length === 0) {
      // migrate old items if any
      const orphanItems = await items
        .find({ password, listId: { $exists: false } })
        .toArray();
      const newList: any = {
        password,
        name: 'Список 1',
        completed: false,
        createdAt: new Date(),
        defaultColor: '#ffffff',
      };
      const result = await lists.insertOne(newList);
      existingLists = [{ ...newList, _id: result.insertedId }];
      if (orphanItems.length > 0) {
        await items.updateMany(
          { password, listId: { $exists: false } },
          { $set: { listId: result.insertedId } }
        );
      }
    }

    res.status(200).json(existingLists);
  } else if (req.method === 'POST') {
    const { password, name, defaultColor } = req.body as {
      password?: unknown;
      name?: unknown;
      defaultColor?: unknown;
    };
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const newList: any = {
      password,
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
