// Converts number-related words (e.g., "two", "пять") into digits within a string.
// Supports English and Russian and is intended for smart parsing of user-entered quantities.

export function convertNumberWordsToDigits(input: string, langCode?: string): string {
  if (!input) return input;
  const lang = (langCode || '').toLowerCase();

  const joinTokens = (tokens: string[]) => tokens.join(' ');

  const normalizeTokens = (raw: string[]) =>
    raw
      .map((t) =>
        t
          .replace(/^[^0-9A-Za-z\u0400-\u04FF]+|[^0-9A-Za-z\u0400-\u04FF]+$/g, '')
          .toLowerCase()
      )
      .filter(Boolean);

  const parseNumberSequence = (
    tokens: string[],
    units: Record<string, number>,
    tens: Record<string, number>,
    hundreds: Record<string, number>,
    multipliers: Record<string, number>,
    allowHundreds: boolean
  ) => {
    const out: string[] = [];
    let i = 0;

    while (i < tokens.length) {
      const tryParse = (start: number) => {
        let total = 0;
        let current = 0;
        let j = start;
        let found = false;

        while (j < tokens.length) {
          const w = tokens[j];
          const numMatch = w.match(/^(\d+(?:[.,]\d+)?)$/);
          if (numMatch) {
            current += parseFloat(numMatch[1].replace(',', '.'));
            found = true;
            j += 1;
            continue;
          }

          if (units[w] !== undefined) {
            current += units[w];
            found = true;
            j += 1;
            continue;
          }

          if (tens[w] !== undefined) {
            current += tens[w];
            found = true;
            j += 1;
            continue;
          }

          if (allowHundreds && hundreds[w] !== undefined) {
            current += hundreds[w];
            found = true;
            j += 1;
            continue;
          }

          if (multipliers[w] !== undefined) {
            if (current === 0) current = 1;
            current = current * multipliers[w];
            total += current;
            current = 0;
            found = true;
            j += 1;
            continue;
          }

          break;
        }

        if (!found) return null;
        return { value: total + current, end: j };
      };

      const parsed = tryParse(i);
      if (parsed) {
        out.push(String(parsed.value));
        i = parsed.end;
      } else {
        out.push(tokens[i]);
        i += 1;
      }
    }

    return out;
  };

  if (lang.startsWith('ru')) {
    const units: Record<string, number> = {
      ноль: 0,
      один: 1,
      одна: 1,
      одно: 1,
      двух: 2,
      два: 2,
      две: 2,
      три: 3,
      четыре: 4,
      пять: 5,
      шесть: 6,
      семь: 7,
      восемь: 8,
      девять: 9,
      десять: 10,
      одиннадцать: 11,
      двенадцать: 12,
      тринадцать: 13,
      четырнадцать: 14,
      пятнадцать: 15,
      шестнадцать: 16,
      семнадцать: 17,
      восемнадцать: 18,
      девятнадцать: 19,
    };
    const tens: Record<string, number> = {
      двадцать: 20,
      тридцать: 30,
      сорок: 40,
      пятьдесят: 50,
      шестьдесят: 60,
      семьдесят: 70,
      восемьдесят: 80,
      девяносто: 90,
    };
    const hundreds: Record<string, number> = {
      сто: 100,
      двести: 200,
      триста: 300,
      четыреста: 400,
      пятьсот: 500,
      шестьсот: 600,
      семьсот: 700,
      восемьсот: 800,
      девятьсот: 900,
    };
    const multipliers: Record<string, number> = {
      тысяча: 1000,
      тысячи: 1000,
      тысяч: 1000,
    };

    const rawTokens = input.trim().split(/\s+/).filter(Boolean);
    const tokens = normalizeTokens(rawTokens);

    for (let k = 0; k < tokens.length; k++) {
      if (tokens[k] === 'полтора' || tokens[k] === 'полторы') tokens[k] = '1.5';
      if (tokens[k] === 'полтораста' || tokens[k] === 'полторыста') tokens[k] = '150';
    }

    return joinTokens(parseNumberSequence(tokens, units, tens, hundreds, multipliers, true));
  }

  if (lang.startsWith('en')) {
    const units: Record<string, number> = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
    };
    const tens: Record<string, number> = {
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
    };
    const multipliers: Record<string, number> = {
      hundred: 100,
      thousand: 1000,
      million: 1000000,
    };

    const rawTokens = input.trim().split(/\s+/).filter(Boolean);
    const tokens = normalizeTokens(rawTokens);

    return joinTokens(parseNumberSequence(tokens, units, tens, {}, multipliers, false));
  }

  return input;
}
