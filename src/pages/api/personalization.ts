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
  password: string;
  categories?: StoredCategory[];
  templates?: Template[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = await clientPromise;
  const db = client.db();
  const col = db.collection<PersonalizationDoc>('personalization');

  if (req.method === 'GET') {
    const { password } = req.query;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password query parameter is required' });
      return;
    }

    const doc = await col.findOne({ password });
    if (!doc) {
      res.status(404).json({});
      return;
    }
    res.status(200).json(doc);
  } else if (req.method === 'POST') {
    const { password, categories, templates } = req.body as {
      password?: unknown;
      categories?: unknown;
      templates?: unknown;
    };
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }
    const update: Partial<PersonalizationDoc> = {};
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

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'Nothing to update' });
      return;
    }

    await col.updateOne({ password }, { $set: update }, { upsert: true });
    const newDoc = await col.findOne({ password });
    res.status(200).json(newDoc);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
