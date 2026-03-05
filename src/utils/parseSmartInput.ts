// utility for interpreting a single-line description string into structured fields
// extracted from TodoForm.tsx so it can be reused and tested independently

export interface ParsedInput {
  name: string;
  quantity: number;
  comment: string;
  unit?: string;
  category?: string;
}

// supports integer/decimal quantities, optional unit (kg, г, л, pcs, шт, etc.)
// parser tries two patterns:
//   1. name-first  (e.g. "Milk 2kg", "Bread 3pcs красный")
//   2. quantity-first (e.g. "3 шт Яйцо", "1 пакет сахара")
// remaining words after the recognized quantity are split so the first
// word becomes the name and the rest go into comment.
// examples:
//   "Milk 2kg"          -> {name:"Milk", quantity:2, comment:"kg"}
//   "Молоко 2 л 2.5%"    -> {name:"Молоко", quantity:2, comment:"л 2.5%"}
//   "3 шт Яйцо"          -> {name:"Яйцо", quantity:3, comment:"шт"}
//   "1 пакет сахара"     -> {name:"пакет", quantity:1, comment:"сахара"}
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

export function parseSmartInput(text: string): ParsedInput | null {
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
    return {
      name: m[1].trim(),
      quantity: qty,
      comment,
      unit,
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
    return {
      name: name.trim(),
      quantity: qty,
      comment: comment.trim(),
      unit: unitPart || undefined,
    };
  }

  return null;
}
