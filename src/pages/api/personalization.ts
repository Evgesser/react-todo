import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Template } from '@/types';

export interface StoredCategory {
  value: string;
  label: string;
}

export interface PersonalizationDoc {
  _id?: ObjectId;
  userId: string;
  categories?: StoredCategory[];
  templates?: Template[];
  updatedAt?: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const col = db.collection<PersonalizationDoc>('personalization');

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const doc = await col.findOne({ userId });
    if (!doc) {
      res.status(404).json({});
      return;
    }
    res.status(200).json(doc);
  } else if (req.method === 'POST') {
    const { userId, categories, templates } = req.body as {
      userId?: unknown;
      categories?: unknown;
      templates?: unknown;
    };
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const update: Partial<PersonalizationDoc> = {
      updatedAt: new Date(),
    };
    if (Array.isArray(categories)) {
      // filter elements so they have value/label strings
      update.categories = categories
        .filter(
          (c: unknown): c is StoredCategory => {
            if (typeof c !== 'object' || c === null) return false;
            const o = c as { [key: string]: unknown };
            return typeof o.value === 'string' && typeof o.label === 'string';
          }
        )
        .map((c) => ({ value: c.value, label: c.label }));
    }
    if (Array.isArray(templates)) {
      update.templates = templates as Template[];
    }

    if (Object.keys(update).length === 1) {
      // Only updatedAt, nothing else to update
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    await col.updateOne({ userId }, { $set: update }, { upsert: true });
    const newDoc = await col.findOne({ userId });
    res.status(200).json(newDoc);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
