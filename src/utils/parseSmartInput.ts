// utility for interpreting a single-line description string into structured fields
// extracted from TodoForm.tsx so it can be reused and tested independently

import { categoryKeywords } from '@/constants';

export interface ParsedInput {
  name: string;
  quantity: number;
  comment: string;
  unit?: string;
  category?: string;
}

/**
 * Normalizes input name for classification (removes numbers, units, etc.)
 */
export function normalizeName(name: string): string {
  // strip punctuation and lowercase
  return name.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toLowerCase().trim();
}
// returns null if nothing recognizable
export const RU_UNITS = [
  'шт', 'штук', 'штуки', 'штучек',
  'кг', 'килограмм', 'килограмма', 'килограммов', 'кило',
  'г', 'гр', 'грамм', 'грамма', 'граммов',
  'л', 'литр', 'литра', 'литров',
  'мл', 'миллилитр', 'миллилитра', 'миллилитров',
  'уп', 'упаковка', 'упаковки', 'упаковок',
  'пачка', 'пачки', 'пачек',
  'банка', 'банки', 'банок',
  'бутылка', 'бутылки', 'бутылок',
  '%'
];
export const EN_UNITS = [
  'pcs', 'piece', 'pieces',
  'kg', 'kilogram', 'kilograms', 'kilo',
  'g', 'gram', 'grams',
  'l', 'liter', 'liters', 'litre', 'litres',
  'ml', 'milliliter', 'milliliters',
  'pack', 'package', 'packages',
  'bottle', 'bottles',
  'can', 'cans',
  'oz', 'ounce', 'ounces',
  '%'
];
export const HE_UNITS = [
  'יח', 'יחידה', 'יחידות',
  'קג', 'קילו', 'קילוגרם',
  'גר', 'גרם', 'גרמים',
  'ל', 'ליטר', 'ליטרים',
  'מל', 'מיליליטר',
  'חב', 'חבילה', 'חבילות',
  'אריזה', 'אריזות',
  'בקבוק', 'בקבוקים',
  'פחית', 'פחיות',
  '%'
];

const NUMBER_WORDS: Record<string, number> = {
  // Russian
  'один': 1, 'одна': 1, 'одно': 1,
  'два': 2, 'две': 2,
  'три': 3,
  'четыре': 4,
  'пять': 5,
  'шесть': 6,
  'семь': 7,
  'восемь': 8,
  'девять': 9,
  'десять': 10,
  // English
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  // Hebrew
  'אחד': 1, 'אחת': 1,
  'שניים': 2, 'שתיים': 2, 'שני': 2,
  'שלושה': 3, 'שלוש': 3,
  'ארבעה': 4, 'ארבע': 4,
  'חמישה': 5, 'חמש': 5,
  'שישה': 6, 'שש': 6,
  'שבעה': 7, 'שבע': 7,
  'שמונה': 8,
  'תשעה': 9, 'תשע': 9,
  'עשרה': 10, 'עשר': 10
};

// Optimization: Pre-compile regex for number words mapping
// We use a boundary that checks for start/end of string or non-word characters.
const NUMBER_WORDS_REGEXES = Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .map(word => ({
    word,
    regex: new RegExp(`(?<=^|[^\\p{L}\\p{N}])${word}(?=[^\\p{L}\\p{N}]|$)`, 'gu'),
    value: NUMBER_WORDS[word].toString()
  }));

// Optimization: Pre-compile unit pattern regex
const ALL_UNITS = Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
const UNIT_PATTERN_STR = ALL_UNITS
  .map((u) => u.replace(/[-\/\^$*+?.()|[\]{}]/g, '\\$&'))
  .sort((a, b) => b.length - a.length)
  .join('|');

const NAME_FIRST_REGEX = new RegExp(
  `^(.+?)\\s+(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_PATTERN_STR})(?:\\.?))?(?:\\s+(.*))?$`,
  'i'
);
const QTY_FIRST_REGEX = new RegExp(
  `^(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_PATTERN_STR})(?:\\.?))?\\s+(.*)$`,
  'i'
);

export function getUnitOptions(lang?: string): string[] {
  if (!lang) return Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
  const l = lang.toLowerCase();
  if (l.startsWith('ru')) return RU_UNITS;
  if (l.startsWith('en')) return EN_UNITS;
  if (l.startsWith('he')) return HE_UNITS;
  return Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
}

export function parseSmartInput(text: string, language?: string): ParsedInput | null {
  let trimmed = text.trim().toLowerCase();
  if (!trimmed) return null;

  // Pre-process: replace number words with digits to simplify regex matching
  for (const item of NUMBER_WORDS_REGEXES) {
    if (item.regex.test(trimmed)) {
      trimmed = trimmed.replace(item.regex, item.value);
    }
  }

  // try name-first pattern (previous behaviour)
  let m = trimmed.match(NAME_FIRST_REGEX);
  if (m) {
    const qty = parseFloat(m[2].replace(',', '.'));
    const comment = m[4] ? m[4].trim() : '';
    const unit = m[3] ? m[3].trim() : undefined;
    const name = m[1].trim();
    const category = inferCategory(name, language);
    return {
      name,
      quantity: qty,
      comment,
      unit,
      category,
    };
  }

  // if that didn't work, try quantity-first (e.g. "3 шт Яйцо куриное")
  m = trimmed.match(QTY_FIRST_REGEX);
  if (m) {
    const qty = parseFloat(m[1].replace(',', '.'));
    const unit = m[2] ? m[2].trim() : undefined;
    const rest = m[3].trim();
    let name = '';
    let comment = '';
    if (rest) {
      const parts = rest.split(/\s+/);
      name = parts.shift() || '';
      comment = parts.join(' ');
    }
    const category = inferCategory(name, language);
    return {
      name: name.trim(),
      quantity: qty,
      comment: comment.trim(),
      unit,
      category,
    };
  }

  return null;
}

function inferCategory(name: string, language?: string): string | undefined {
  if (!name) return undefined;
  const lowerName = name.toLowerCase();
  const lang = language || 'en';
  const langKeywords = categoryKeywords[lang] || categoryKeywords.en;
  for (const [iconKey, kws] of Object.entries(langKeywords)) {
    if (kws.some((k) => lowerName.includes(k))) {
      return iconKey;
    }
  }
  return undefined;
}

/**
 * Async version of category inference that can talk to our smart API
 * Falls back to static inference if API fails
 */
export async function inferCategorySmart(name: string, language?: string): Promise<string | undefined> {
  const staticResult = inferCategory(name, language);
  if (staticResult) return staticResult;

  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: name }),
    });
    if (res.ok) {
      const { category } = await res.json();
      return category;
    }
  } catch (e) {
    console.error('Smart classification failed', e);
  }
  return undefined;
}
