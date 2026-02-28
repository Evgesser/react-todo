import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface CaptchaResponse {
  question: string;
  num1: number;
  num2: number;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CaptchaResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  // Generate captcha based on username hash (so it's deterministic)
  const captchaHash = crypto.createHash('md5').update(username.toLowerCase()).digest('hex');
  const num1 = parseInt(captchaHash.substring(0, 2), 16) % 50 + 1;
  const num2 = parseInt(captchaHash.substring(2, 4), 16) % 50 + 1;

  res.status(200).json({
    question: `${num1} + ${num2} = ?`,
    num1,
    num2,
  });
}
