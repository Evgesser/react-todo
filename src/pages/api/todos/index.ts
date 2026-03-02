import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('todos');

  if (req.method === 'GET') {
    const { listId, category } = req.query;
    if (!listId || typeof listId !== 'string') {
      res.status(400).json({ error: 'listId query parameter is required' });
      return;
    }
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const filter: any = { listId: new ObjectId(listId) };
    if (category && typeof category === 'string' && category.trim() !== '') {
      filter.category = category;
    }

    const todos = await collection.find(filter).sort({ order: 1 }).toArray();
    res.status(200).json(todos);
  } else if (req.method === 'POST') {
    const {
      listId,
      name,
      description,
      quantity,
      comment,
      color,
      category,
      order,
      missing,
    } = req.body as {
      listId?: unknown;
      name?: unknown;
      description?: unknown;
      quantity?: unknown;
      comment?: unknown;
      color?: unknown;
      category?: unknown;
      order?: unknown;
      missing?: unknown;
    };

    if (!listId || typeof listId !== 'string') {
      res.status(400).json({ error: 'listId is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const item: any = {
      listId: new ObjectId(listId),
      name,
      completed: false,
      missing: typeof missing === 'boolean' ? missing : false,
      description: typeof description === 'string' ? description : '',
      quantity: typeof quantity === 'number' ? quantity : 1,
      comment: typeof comment === 'string' ? comment : '',
      color: typeof color === 'string' ? color : '',
      category: typeof category === 'string' ? category : '',
      order: typeof order === 'number' ? order : 0,
    };

    const result = await collection.insertOne(item);
    res.status(201).json({ _id: result.insertedId, ...item });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
