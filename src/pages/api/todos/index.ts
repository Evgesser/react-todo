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
    
    interface TodoFilter { listId: ObjectId; category?: string }
    const filter: TodoFilter = { listId: new ObjectId(listId) };
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
      unit,
      image,
      amount,
      spentAt,
      dueDate,
      priority,
      reminderAt,
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
      unit?: unknown;
      image?: unknown;
      amount?: unknown;
      spentAt?: unknown;
      dueDate?: unknown;
      priority?: unknown;
      reminderAt?: unknown;
    };

    if (!listId || typeof listId !== 'string') {
      res.status(400).json({ error: 'listId is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    interface TodoDoc {
      listId: ObjectId;
      name: string;
      completed: boolean;
      missing: boolean;
      description: string;
      quantity: number;
      unit?: string;
      comment: string;
      color: string;
      category: string;
      order: number;
      image?: string;
      amount?: number;
      spentAt?: Date;
      dueDate?: Date;
      priority?: string;
      reminderAt?: Date;
    }
    const item: TodoDoc = {
      listId: new ObjectId(listId),
      name,
      completed: false,
      missing: typeof missing === 'boolean' ? missing : false,
      description: typeof description === 'string' ? description : '',
      quantity: typeof quantity === 'number' ? quantity : 1,
      unit: typeof unit === 'string' ? unit : '',
      comment: typeof comment === 'string' ? comment : '',
      color: typeof color === 'string' ? color : '',
      category: typeof category === 'string' ? category : '',
      order: typeof order === 'number' ? order : 0,
      image: typeof image === 'string' ? image : undefined,
      amount: typeof amount === 'number' ? amount : undefined,
      spentAt: typeof spentAt === 'string' ? new Date(spentAt) : undefined,
      dueDate: typeof dueDate === 'string' ? new Date(dueDate) : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      reminderAt: typeof reminderAt === 'string' ? new Date(reminderAt) : undefined,
    };

    const result = await collection.insertOne(item);
    res.status(201).json({ _id: result.insertedId, ...item });
  } else if (req.method === 'PATCH') {
    const { listId, fromCategory, toCategory } = req.body as {
      listId?: string;
      fromCategory?: string;
      toCategory?: string;
    };

    if (!listId || !fromCategory || !toCategory) {
      res.status(400).json({ error: 'listId, fromCategory and toCategory are required' });
      return;
    }

    await collection.updateMany(
      { listId: new ObjectId(listId), category: fromCategory },
      { $set: { category: toCategory } }
    );

    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
