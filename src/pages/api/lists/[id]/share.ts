import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const client = await clientPromise;
  const db = client.db();
  const lists = db.collection('lists');

  let objId: ObjectId;
  try {
    objId = new ObjectId(id);
  } catch {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  if (req.method === 'GET') {
    const listDoc = await lists.findOne({ _id: objId });
    if (!listDoc) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ token: listDoc.shareToken || '' });
    return;
  }

  if (req.method === 'POST') {
    // create and persist a new random token
    const token = randomBytes(16).toString('hex');
    const result = await lists.updateOne({ _id: objId }, { $set: { shareToken: token } });
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json({ token });
    return;
  }

  if (req.method === 'DELETE') {
    const result = await lists.updateOne({ _id: objId }, { $set: { shareToken: '' } });
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
