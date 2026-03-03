// utility for interpreting a single-line description string into structured fields
// extracted from TodoForm.tsx so it can be reused and tested independently

export interface ParsedInput {
  name: string;
  quantity: number;
  comment: string;
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
export function parseSmartInput(text: string): ParsedInput | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const ruUnits = ['шт', 'кг', 'г', 'гр', 'л', 'мл', 'литр', 'литра', 'литров', 'уп', '%'];
  const enUnits = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'oz', '%'];
  // always include both sets so parser works regardless of UI language
  const units = Array.from(new Set([...ruUnits, ...enUnits]));
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
    return {
      name: m[1].trim(),
      quantity: qty,
      comment,
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
    let finalComment = unitPart;
    if (comment && finalComment) finalComment = `${unitPart} ${comment}`;
    else if (comment) finalComment = comment;
    return {
      name: name.trim(),
      quantity: qty,
      comment: finalComment.trim(),
    };
  }

  return null;
}
