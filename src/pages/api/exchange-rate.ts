import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const from = typeof req.query.from === 'string' ? req.query.from.trim().toUpperCase() : '';
  const to = typeof req.query.to === 'string' ? req.query.to.trim().toUpperCase() : '';

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from/to query parameters' });
  }

  try {
    const frankfurterRes = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (!frankfurterRes.ok) {
      const body = await frankfurterRes.text();
      return res.status(502).json({ error: 'Failed to fetch exchange rate', details: body });
    }

    const json = await frankfurterRes.json();
    const rate = json?.rates?.[to];
    if (typeof rate !== 'number') {
      return res.status(502).json({ error: 'Exchange rate not available' });
    }

    return res.status(200).json({ rate });
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch exchange rate', details: (error as Error).message });
  }
}
