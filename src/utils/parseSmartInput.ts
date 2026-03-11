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
export const RU_UNITS = ['шт', 'кг', 'г', 'гр', 'л', 'мл', 'литр', 'литра', 'литров', 'уп', '%'];
export const EN_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'oz', '%'];
export const HE_UNITS = ['יח', 'יחידות', 'קג', 'גרם', 'ליטר', 'מל', 'מיליליטר', 'חבילה', 'אריזה', '%'];
export function getUnitOptions(lang?: string): string[] {
  if (!lang) return Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
  const l = lang.toLowerCase();
  if (l.startsWith('ru')) return RU_UNITS;
  if (l.startsWith('en')) return EN_UNITS;
  if (l.startsWith('he')) return HE_UNITS;
  return Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
}

export function parseSmartInput(text: string, language?: string): ParsedInput | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // always include known sets so parser works regardless of UI language
  const units = Array.from(new Set([...RU_UNITS, ...EN_UNITS, ...HE_UNITS]));
  // escape for regex, sort by length desc to match longer words first
  const escaped = units.map((u) => u.replace(/[-\/\^$*+?.()|[\]{}]/g, '\\$&')).sort((a,b)=>b.length-a.length);
  const unitPattern = escaped.join('|');

  // try name-first pattern (previous behaviour)
  const nameFirst = new RegExp(
    `^(.+?)\\s+(\\d+(?:[.,]\\d+)?)(?:\\s*(${unitPattern})(?:\\.?))?(?:\\s+(.*))?$`,
    'i'
  );
  let m = trimmed.match(nameFirst);
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
  const qtyFirst = new RegExp(
    `^(\\d+(?:[.,]\\d+)?)(?:\\s*(${unitPattern})(?:\\.?))?\\s+(.*)$`,
    'i'
  );
  m = trimmed.match(qtyFirst);
  if (m) {
    const qty = parseFloat(m[1].replace(',', '.'));
    const unitPart = m[2] ? m[2].trim() : '';
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
      unit: unitPart || undefined,
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
