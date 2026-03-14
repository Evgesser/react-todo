const CACHE_KEY = 'exchangeRatesCache';
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours

export interface ExchangeRateCacheEntry {
  rate: number;
  ts: number;
}

function loadCache(): Record<string, ExchangeRateCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, ExchangeRateCacheEntry>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, ExchangeRateCacheEntry>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function getCachedExchangeRate(from: string, to: string, maxAgeMs: number = MAX_AGE_MS): number | null {
  const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
  const cache = loadCache();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > maxAgeMs) return null;
  return entry.rate;
}

export function setCachedExchangeRate(from: string, to: string, rate: number) {
  const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
  const cache = loadCache();
  cache[key] = { rate, ts: Date.now() };
  saveCache(cache);
}
