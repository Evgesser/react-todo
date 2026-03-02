import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Template } from '@/types';

export interface StoredCategory {
  value: string;
  label: string;
  icon?: string;
}

export interface PersonalizationDoc {
  _id?: ObjectId;
  userId: string;
  categories?: StoredCategory[];
  templates?: Template[];
  // mapping of item name to preferred category value
  nameCategoryMap?: Record<string, string>;
  // list of products user has seen/added
  products?: { name: string; category?: string }[];
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
    const { userId, categories, templates, nameCategoryMap, products } = req.body as {
      userId?: unknown;
      categories?: unknown;
      templates?: unknown;
      nameCategoryMap?: unknown;
      products?: unknown;
    };
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const update: Partial<PersonalizationDoc> = {
      updatedAt: new Date(),
    };
    if (Array.isArray(categories)) {
      // filter elements so they have value/label (and optionally icon) strings
      update.categories = categories
        .filter(
          (c: unknown): c is StoredCategory => {
            if (typeof c !== 'object' || c === null) return false;
            const o = c as { [key: string]: unknown };
            if (typeof o.value !== 'string' || typeof o.label !== 'string') return false;
            if (o.icon !== undefined && typeof o.icon !== 'string') return false;
            return true;
          }
        )
        .map((c) => ({ value: c.value, label: c.label, icon: c.icon }));
    }
    if (Array.isArray(templates)) {
      update.templates = templates as Template[];
    }
    if (nameCategoryMap && typeof nameCategoryMap === 'object' && !Array.isArray(nameCategoryMap)) {
      update.nameCategoryMap = Object.fromEntries(
        Object.entries(nameCategoryMap).filter(
          ([k, v]) => typeof k === 'string' && typeof v === 'string'
        )
      );
    }
    if (Array.isArray(products)) {
      update.products = products
        .filter(
          (p: unknown): p is { name: string; category?: string } => {
            if (typeof p !== 'object' || p === null) return false;
            const o = p as { [key: string]: unknown };
            if (typeof o.name !== 'string') return false;
            if (o.category !== undefined && typeof o.category !== 'string') return false;
            return true;
          }
        )
        .map((p) => ({ name: p.name, category: p.category }));
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
