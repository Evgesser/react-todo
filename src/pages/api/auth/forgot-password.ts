import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail, setResetToken, setResetLastSentAt, setResetTriesAndBlock } from '../../../lib/mongodb';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }


  // Экспоненциальная задержка и блокировка
  const now = Date.now();
  const tries = user.resetTries || 0;
  const blockedUntil = user.resetBlockedUntil || 0;
  if (blockedUntil && now < blockedUntil) {
    return res.status(429).json({ message: 'Слишком много попыток. Аккаунт временно заблокирован. Обратитесь в поддержку.' });
  }
  if (tries >= 10) {
    const blockTime = now + 1000 * 60 * 60 * 24; // 24 часа блокировка
    await setResetTriesAndBlock(user._id, tries, blockTime);
    return res.status(429).json({ message: 'Слишком много попыток. Аккаунт заблокирован на сутки. Обратитесь в поддержку.' });
  }
  const minInterval = 1000 * 60 * Math.max(1, Math.min(tries + 1, 10)); // 1,2,3...10 мин
  if (user.resetLastSentAt && now - user.resetLastSentAt < minInterval) {
    const wait = Math.ceil((minInterval - (now - user.resetLastSentAt)) / 1000);
    return res.status(429).json({ message: `Письмо уже отправлено недавно. Попробуйте через ${wait} секунд.` });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = now + 1000 * 60 * 60; // 1 hour
  await setResetToken(user._id, token, expires);

  // Настройте транспорт для отправки email
  const transporter = nodemailer.createTransport({
    service: 'gmail', // или другой сервис
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Roboto, Arial, sans-serif; background: #f5f5f5; padding: 32px;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px;">
        <h2 style="color: #1976d2; margin-top: 0;">Восстановление пароля</h2>
        <p style="font-size: 16px; color: #333;">Вы запросили сброс пароля для своей учетной записи.</p>
        <p style="font-size: 16px; color: #333;">Чтобы задать новый пароль, нажмите на кнопку ниже:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #1976d2; color: #fff; text-decoration: none; font-weight: 500; padding: 14px 32px; border-radius: 4px; font-size: 16px;">Сбросить пароль</a>
        </div>
        <p style="font-size: 14px; color: #888;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #bbb; text-align: center;">&copy; ${new Date().getFullYear()} react-todo</p>
      </div>
    </div>
  `;
  await transporter.sendMail({
    to: email,
    subject: 'Восстановление пароля',
    text: `Перейдите по ссылке для сброса пароля: ${resetUrl}`,
    html,
  });

  await setResetLastSentAt(user._id, now);
  await setResetTriesAndBlock(user._id, tries + 1);
  res.status(200).json({ message: 'Reset email sent' });
}
