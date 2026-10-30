// Live prices for market-traded holdings. Cached on disk and refreshed once a day
// after the ASX close (plus on demand), so values survive server restarts.
import fs from 'node:fs/promises';
import path from 'node:path';

// Holdings priced from a market feed. `id` matches the badge/ticker used on the Investments screen.
// Units are what Alex holds; edit here when buying or selling.
export const LIVE_HOLDINGS = [
  { id: 'VDHG', name: 'Vanguard Diversified High Growth', source: 'yahoo', symbol: 'VDHG.AX', units: 645 },
  { id: 'IVV', name: 'iShares S&P 500', source: 'yahoo', symbol: 'IVV.AX', units: 310 },
  { id: 'BTC', name: 'Bitcoin', source: 'coingecko', symbol: 'bitcoin', units: 0.062 }
];

// Vercel functions can only write to /tmp; each instance also keeps the cache in memory.
const CACHE_FILE = process.env.VERCEL
  ? '/tmp/ledger-prices.json'
  : path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'prices.json');
const TZ = 'Australia/Brisbane';
const REFRESH_AFTER = { hour: 16, minute: 30 }; // ASX closes 4pm Sydney time
const UA = { 'user-agent': 'Mozilla/5.0 (Ledger personal finance app)' };

let cache = null;      // { fetchedAt, quotes: { [id]: { price, prevClose, change, changePct, currency, asOf, units, value } }, errors }
let inflight = null;

async function fetchYahoo(symbol) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`, { headers: UA });
  if (!r.ok) throw new Error(`Yahoo ${symbol}: HTTP ${r.status}`);
  const meta = (await r.json())?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error(`Yahoo ${symbol}: no price`);
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
  return {
    price: meta.regularMarketPrice,
    prevClose,
    changePct: meta.regularMarketChangePercent ?? (prevClose ? (meta.regularMarketPrice / prevClose - 1) * 100 : null),
    currency: meta.currency || 'AUD',
    asOf: new Date(meta.regularMarketTime * 1000).toISOString()
  };
}

async function fetchCoinGecko(id) {
  const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=aud&include_24hr_change=true&include_last_updated_at=true`, { headers: UA });
  if (!r.ok) throw new Error(`CoinGecko ${id}: HTTP ${r.status}`);
  const q = (await r.json())?.[id];
  if (!q || typeof q.aud !== 'number') throw new Error(`CoinGecko ${id}: no price`);
  return { price: q.aud, prevClose: null, changePct: q.aud_24h_change ?? null, currency: 'AUD', asOf: new Date(q.last_updated_at * 1000).toISOString() };
}

export async function refreshPrices() {
  if (inflight) return inflight;
  inflight = (async () => {
    const prev = cache?.quotes || {};
    const quotes = {}, errors = {};
    await Promise.all(LIVE_HOLDINGS.map(async h => {
      try {
        const q = h.source === 'yahoo' ? await fetchYahoo(h.symbol) : await fetchCoinGecko(h.symbol);
        const change = q.changePct == null ? null : q.price * h.units * (1 - 1 / (1 + q.changePct / 100));
        quotes[h.id] = { ...q, units: h.units, value: q.price * h.units, dayChange: change };
      } catch (e) {
        errors[h.id] = e.message;
        if (prev[h.id]) quotes[h.id] = { ...prev[h.id], stale: true }; // keep last good price
      }
    }));
    cache = { fetchedAt: new Date().toISOString(), quotes, errors };
    try {
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) { console.warn('[prices] could not write cache:', e.message); }
    const failed = Object.keys(errors);
    console.log(`[prices] refreshed ${Object.keys(quotes).length - failed.length}/${LIVE_HOLDINGS.length}` + (failed.length ? ` (failed: ${failed.join(', ')})` : ''));
    return cache;
  })().finally(() => { inflight = null; });
  return inflight;
}

// Wall-clock parts in Brisbane time (no DST, UTC+10).
function brisbaneParts(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-AU', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, mins: Number(p.hour) * 60 + Number(p.minute) };
}

// Stale when there's no data, it's over 24h old, or today's post-close refresh hasn't happened yet.
function isStale(now = new Date()) {
  if (!cache?.fetchedAt) return true;
  const last = new Date(cache.fetchedAt);
  if (now - last > 24 * 3600e3) return true;
  const n = brisbaneParts(now), l = brisbaneParts(last), cutoff = REFRESH_AFTER.hour * 60 + REFRESH_AFTER.minute;
  return n.mins >= cutoff && (l.day !== n.day || l.mins < cutoff);
}

export async function getPrices() {
  if (!cache) { try { cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8')); } catch { /* none yet */ } }
  if (isStale()) {
    try { await refreshPrices(); } catch (e) { console.error('[prices]', e.message); }
  }
  return cache;
}

export async function startPriceScheduler() {
  try { cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8')); } catch { /* first run */ }
  getPrices();
  setInterval(getPrices, 15 * 60e3).unref(); // checks every 15 min; only fetches when stale
}
