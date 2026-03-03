import { ru } from './ru';
import { en } from './en';
import { he } from './he';

export const translations = {
  ru,
  en,
  he,
};

export type Language = keyof typeof translations;

export { ru, en, he };
