// quick JS version of parser for testing
function parseSmartInput(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const ruUnits = ['шт', 'кг', 'г', 'гр', 'л', 'мл', 'литр', 'литра', 'литров', 'уп', '%'];
  const enUnits = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'oz', '%'];
  const units = Array.from(new Set([...ruUnits, ...enUnits]));
  const escaped = units.map((u) => u.replace(/[-\/\^$*+?.()|[\]{}]/g, '\\$&')).sort((a,b)=>b.length-a.length);
  const unitPattern = escaped.join('|');

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

const samples = ['Ягода калина 8кг синяя','3 шт Яйцо','8кг Ягода','2kg Apples','5 oz meat red','1 пакет сахара','пакет 1 сахар','1.5 л молока'];
samples.forEach(s=>console.log(s, parseSmartInput(s)));
