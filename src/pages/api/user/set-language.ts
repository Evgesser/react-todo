import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { language } = req.body as { language?: string };
  if (!language || (language !== 'ru' && language !== 'en' && language !== 'he')) {
    res.status(400).json({ error: 'Invalid language' });
    return;
  }
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `language=${encodeURIComponent(language)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`);
  res.status(200).json({ ok: true });
}
