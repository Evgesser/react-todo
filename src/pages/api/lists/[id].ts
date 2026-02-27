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
  const lists = db.collection('lists');

  const objId = new ObjectId(id);

  switch (method) {
    case 'PUT': {
      const { completed, name, defaultColor } = body as {
        completed?: unknown;
        name?: unknown;
        defaultColor?: unknown;
      };
      const update: any = {};
      if (typeof name === 'string') update.name = name;
      if (typeof defaultColor === 'string') update.defaultColor = defaultColor;
      if (typeof completed === 'boolean') {
        update.completed = completed;
        if (completed) update.finishedAt = new Date();
      }
      if (Object.keys(update).length === 0) {
        res.status(400).json({ error: 'Nothing to update' });
        return;
      }
      const result = await lists.updateOne({ _id: objId }, { $set: update });
      if (result.matchedCount === 0) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.status(200).json({ _id: id, ...update });
      }
      break;
    }
    case 'DELETE': {
      await lists.deleteOne({ _id: objId });
      res.status(204).end();
      break;
    }
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
