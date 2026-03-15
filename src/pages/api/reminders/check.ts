import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ reminders: Array<{ todoId: string; name: string; listName: string; reminderAt: string; }> } | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId query parameter is required' });
    return;
  }

  const client = await clientPromise;
  const db = client.db();
  const users = db.collection('users');
  const lists = db.collection('lists');
  const todos = db.collection('todos');

  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return res.status(200).json({ reminders: [] });
  }

  const now = new Date();
  const showWindow = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24 hours

  const userLists = await lists.find({ userId }).toArray();
  if (!userLists.length) {
    return res.status(200).json({ reminders: [] });
  }

  const listIds = userLists.map((l) => l._id);
  const listNameById = new Map<string, string>();
  userLists.forEach((l) => listNameById.set(l._id.toString(), l.name));

  const pending = await todos
    .find({
      listId: { $in: listIds },
      reminderAt: { $exists: true, $ne: null, $gte: now, $lte: showWindow },
    })
    .toArray();

  const reminders = pending.map((t) => ({
    todoId: t._id.toString(),
    name: t.name || 'Untitled',
    listName: listNameById.get(t.listId.toString()) || '',
    reminderAt: t.reminderAt ? new Date(t.reminderAt).toISOString() : '',
  }));

  res.status(200).json({ reminders });
}
