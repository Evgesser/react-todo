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
        status,
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
      } = body as {
        listId?: unknown;
        name?: unknown;
        description?: unknown;
        quantity?: unknown;
        completed?: unknown;
        status?: unknown;
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
        res.status(400).json({ error: 'listId required for update' });
        return;
      }

      const update: {
        name?: string;
        description?: string;
        quantity?: number;
        completed?: boolean;
        status?: string;
        missing?: boolean;
        comment?: string;
        unit?: string;
        color?: string;
        category?: string;
        order?: number;
        image?: string;
        amount?: number;
        spentAt?: Date;
        dueDate?: Date;
        priority?: string;
        reminderAt?: Date;
      } = {};

      if (typeof name === 'string') update.name = name;
      if (typeof description === 'string') update.description = description;
      if (typeof quantity === 'number') update.quantity = quantity;
      if (typeof completed === 'boolean') update.completed = completed;
      if (typeof status === 'string') update.status = status;
      if (typeof missing === 'boolean') update.missing = missing;
      if (typeof comment === 'string') update.comment = comment;
      if (typeof unit === 'string') update.unit = unit;
      if (typeof color === 'string') update.color = color;
      if (typeof category === 'string') update.category = category;
      if (typeof order === 'number') update.order = order;
      if (typeof image === 'string') update.image = image;
      if (typeof amount === 'number') update.amount = amount;
      if (typeof spentAt === 'string') update.spentAt = new Date(spentAt);
      if (typeof dueDate === 'string') update.dueDate = new Date(dueDate);
      if (typeof priority === 'string') update.priority = priority;
      if (typeof reminderAt === 'string') update.reminderAt = new Date(reminderAt);

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
