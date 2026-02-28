import { ru } from './ru';
import { en } from './en';

export const translations = {
  ru,
  en,
};

export type Language = keyof typeof translations;

export { ru, en };
