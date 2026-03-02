import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;
  if (!token || Array.isArray(token)) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }

  const client = await clientPromise;
  const db = client.db();
  const lists = db.collection('lists');
  const todos = db.collection('todos');

  // find list by shareToken
  const listDoc = await lists.findOne({ shareToken: token });
  if (!listDoc) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  if (req.method === 'GET') {
    // return list and todos belonging to it
    const listIdObj = listDoc._id; // this is an ObjectId
    const todoItems = await todos
      .find({ listId: listIdObj })
      .sort({ order: 1 })
      .toArray();
    // convert each todo _id and listId to string so client doesn't choke on ObjectId
    // cast database results to a more specific type so we can access fields safely
    type TodoDoc = {
      _id: ObjectId;
      listId: ObjectId | string;
      [key: string]: unknown;
    };
    const sanitizedTodos = (todoItems as TodoDoc[]).map((t) => {
      const { _id, listId, ...rest } = t;
      // `rest` is unknown, cast when spreading
      return { _id: _id.toString(), listId: listId?.toString?.() || '', ...(rest as Record<string, unknown>) };
    });
    // we don't want to leak userId or other sensitive fields
    const sanitizedList = {
      _id: listDoc._id.toString(),
      name: listDoc.name,
      completed: listDoc.completed,
      defaultColor: listDoc.defaultColor,
    };
    res.status(200).json({ list: sanitizedList, todos: sanitizedTodos });
    return;
  }

  if (req.method === 'PATCH') {
    // only allow toggling completed/missing or updating order/category
    const {
      todoId,
      completed,
      missing,
      order,
      category,
    } = req.body as {
      todoId?: unknown;
      completed?: unknown;
      missing?: unknown;
      order?: unknown;
      category?: unknown;
    };

    if (!todoId || typeof todoId !== 'string') {
      res.status(400).json({ error: 'todoId is required' });
      return;
    }

    const update: Partial<{
      completed: boolean;
      missing: boolean;
      order: number;
      category: string;
    }> = {};
    if (typeof completed === 'boolean') update.completed = completed;
    if (typeof missing === 'boolean') update.missing = missing;
    if (typeof order === 'number') update.order = order;
    if (typeof category === 'string') update.category = category;

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    const result = await todos.updateOne(
      { _id: new ObjectId(todoId), listId: listDoc._id }, // listId stored as ObjectId
      { $set: update }
    );
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Todo not found' });
    } else {
      res.status(200).json({ _id: todoId, ...update });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
