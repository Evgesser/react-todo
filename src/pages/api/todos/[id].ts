import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
    body,
  } = req;

  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection('todos');

  switch (method) {
    case 'PUT': {
      const {
        listId,
        name,
        description,
        quantity,
        completed,
        comment,
        color,
        category,
        order,
        missing,
      } = body as {
        listId?: unknown;
        name?: unknown;
        description?: unknown;
        quantity?: unknown;
        completed?: unknown;
        comment?: unknown;
        color?: unknown;
        category?: unknown;
        order?: unknown;
        missing?: unknown;
      };

      if (!listId || typeof listId !== 'string') {
        res.status(400).json({ error: 'listId required for update' });
        return;
      }

      const update: {
        name?: string;
        description?: string;
        quantity?: number;
        completed?: boolean;
        missing?: boolean;
        comment?: string;
        color?: string;
        category?: string;
        order?: number;
      } = {};

      if (typeof name === 'string') update.name = name;
      if (typeof description === 'string') update.description = description;
      if (typeof quantity === 'number') update.quantity = quantity;
      if (typeof completed === 'boolean') update.completed = completed;
      if (typeof missing === 'boolean') update.missing = missing;
      if (typeof comment === 'string') update.comment = comment;
      if (typeof color === 'string') update.color = color;
      if (typeof category === 'string') update.category = category;
      if (typeof order === 'number') update.order = order;

      if (Object.keys(update).length === 0) {
        res.status(400).json({ error: 'Nothing to update' });
        return;
      }

      const filter = { _id: new ObjectId(id), listId: new ObjectId(listId) };
      const result = await collection.updateOne(filter, { $set: update });
      if (result.matchedCount === 0) {
        res.status(404).json({ error: 'Not found or wrong list' });
      } else {
        res.status(200).json({ _id: id, ...update });
      }
      break;
    }
    case 'DELETE': {
      const { listId } = body as { listId?: unknown };
      if (!listId || typeof listId !== 'string') {
        res.status(400).json({ error: 'listId required for delete' });
        return;
      }
      const result = await collection.deleteOne({ _id: new ObjectId(id), listId: new ObjectId(listId) });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: 'Not found or wrong list' });
      } else {
        res.status(204).end();
      }
      break;
    }
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
