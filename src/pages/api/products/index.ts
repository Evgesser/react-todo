import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

import type { ProductDoc } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const col = db.collection<ProductDoc>('products');

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    const items = await col.find({ userId }).toArray();
    // convert ObjectId
    const out = items.map((p) => ({
      ...p,
      _id: p._id?.toString(),
    }));
    res.status(200).json(out);
  } else if (req.method === 'POST') {
    const { userId, name, category, comment, icon } = req.body as {
      userId?: unknown;
      name?: unknown;
      category?: unknown;
      comment?: unknown;
      icon?: unknown;
    };
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const filter = { userId, name };
    const update: Partial<ProductDoc> = {
      userId,
      name,
      updatedAt: new Date(),
    };
    if (typeof category === 'string') update.category = category;
    if (typeof comment === 'string') update.comment = comment;
    if (typeof icon === 'string') update.icon = icon;
    // store createdAt on insert
    const opts = { upsert: true };
    await col.updateOne(filter, { $set: update, $setOnInsert: { createdAt: new Date() } }, opts);
    const doc = await col.findOne(filter);
    if (doc) {
      res.status(200).json({ ...doc, _id: doc._id?.toString() });
    } else {
      res.status(500).json({ error: 'Failed to save' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
