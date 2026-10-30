import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getVercelOidcToken } from '@vercel/oidc';
import { FINANCE_CONTEXT } from './lib/finance-context.js';
import { getPrices, refreshPrices, startPriceScheduler } from './lib/prices.js';
import { authConfig, gate, checkPassword, createSession, sessionCookie, clearCookie, verifySession, readCookie } from './lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOSTED = !!process.env.VERCEL;

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '200kb' }));

// Password gate. On Vercel, proxy.js also runs this before the static screens.
app.use(async (req, res, next) => {
  const decision = await gate(authConfig(), req.path, req.headers.cookie);
  if (decision === 'allow') return next();
  if (decision === 'deny-api') return res.status(401).json({ error: 'Sign in to use Ledger.' });
  res.redirect(302, '/login' + (req.path !== '/' ? `?next=${encodeURIComponent(req.path)}` : ''));
});

// Simple per-IP lockout: 5 wrong passwords → 60s cooldown (per server instance).
const fails = new Map();
app.post('/api/login', async (req, res) => {
  const cfg = authConfig(), ip = req.ip || 'unknown', now = Date.now();
  if (!cfg.enabled) return res.status(503).json({ error: 'No password is set for this app. Add APP_PASSWORD to the environment.' });
  const f = fails.get(ip);
  if (f && f.until > now) return res.status(429).json({ error: `Too many attempts, try again in ${Math.ceil((f.until - now) / 1000)}s`, retryAfter: Math.ceil((f.until - now) / 1000) });
  if (!(await checkPassword(cfg, req.body?.password))) {
    const n = (f && f.until <= now && f.n >= 5 ? 0 : f?.n || 0) + 1;
    fails.set(ip, { n, until: n >= 5 ? now + 60e3 : 0 });
    return res.status(401).json({ error: 'Incorrect password', attemptsLeft: Math.max(0, 5 - n) });
  }
  fails.delete(ip);
  const { token, maxAge } = await createSession(cfg, !!req.body?.remember);
  res.setHeader('Set-Cookie', sessionCookie(token, maxAge, req.secure || HOSTED));
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.setHeader('Set-Cookie', clearCookie(req.secure || HOSTED)); res.json({ ok: true }); });
app.get('/api/session', async (req, res) => {
  const cfg = authConfig();
  res.json({ passwordRequired: cfg.enabled || HOSTED, signedIn: await verifySession(cfg, readCookie(req.headers.cookie)) });
});

// The Claude Design runtime fetches sibling *.dc.html files, so serve the design folder as-is.
// (On Vercel, public/ is served from the CDN and vercel.json handles these routes.)
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'Dashboard.dc.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/review', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'Dashboard Review.dc.html')));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const SYSTEM = `You are the AI assistant inside Ledger, Alex's personal finance dashboard.
Answer questions about Alex's transactions, budgets, income, goals, investments, projections and FIRE plan using ONLY the data below. Do the arithmetic yourself and show concrete dollar figures (AUD, e.g. $1,240 or $725.85).
If the data doesn't cover something, say so plainly and suggest what Alex could check in the app.
Style: warm, direct, plain English. 1–3 short sentences in "text". No markdown, no bullet points, no headings.
Add "stats" (at most 3 key figures) when numbers are the answer, and "bars" (at most 4) when comparing progress against limits or targets; otherwise leave them empty.
Tones: "ink" neutral, "pri" good/positive, "gold" highlight or caution, "neg" over budget or behind.
Insights are general information, not personal financial advice — don't recommend specific financial products.

<finance_data>
${FINANCE_CONTEXT}
</finance_data>`;

const TONE = { type: 'string', enum: ['ink', 'pri', 'gold', 'neg'] };
const ANSWER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'stats', 'bars'],
  properties: {
    text: { type: 'string' },
    stats: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['label', 'value', 'tone'],
        properties: { label: { type: 'string' }, value: { type: 'string' }, tone: TONE }
      }
    },
    bars: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['label', 'value', 'percent', 'tone'],
        properties: {
          label: { type: 'string', description: 'e.g. "Groceries · $725.85 of $650"' },
          value: { type: 'string', description: 'e.g. "112%"' },
          percent: { type: 'number', description: 'Bar fill 0–100' },
          tone: TONE
        }
      }
    }
  }
};

// A direct Anthropic key wins. Otherwise route through Vercel AI Gateway, using an
// AI_GATEWAY_API_KEY or, when deployed on Vercel, the deployment's own OIDC token (no key needed).
const GATEWAY_URL = 'https://ai-gateway.vercel.sh';
let directClient;
async function getAi() {
  if (process.env.ANTHROPIC_API_KEY) {
    directClient ??= new Anthropic();
    return { client: directClient, model: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5', gateway: false };
  }
  let token = process.env.AI_GATEWAY_API_KEY;
  if (!token) { try { token = await getVercelOidcToken(); } catch { /* not on Vercel */ } }
  if (!token) return null;
  return { client: new Anthropic({ apiKey: token, baseURL: GATEWAY_URL }), model: process.env.AI_GATEWAY_MODEL || 'anthropic/claude-opus-5.5', gateway: true };
}

app.get('/api/health', async (_req, res) => {
  const ai = await getAi();
  res.json({ ok: true, ai: !!ai, via: ai ? (ai.gateway ? 'ai-gateway' : 'anthropic') : null, model: ai?.model ?? null });
});

app.get('/api/prices', async (_req, res) => {
  const prices = await getPrices();
  if (!prices) return res.status(503).json({ error: 'Prices are not available yet.' });
  res.json(prices);
});

app.post('/api/prices/refresh', async (_req, res) => {
  try { res.json(await refreshPrices()); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.post('/api/chat', async (req, res) => {
  const ai = await getAi();
  if (!ai) {
    return res.status(503).json({ error: 'AI assistant is not configured. Add ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY to .env and restart the server.' });
  }
  const messages = (Array.isArray(req.body?.messages) ? req.body.messages : [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Send a conversation that ends with a user message.' });
  }

  try {
    const prices = await getPrices();
    const live = prices ? Object.entries(prices.quotes).map(([id, q]) =>
      `${id}: ${q.units} units @ $${q.price.toFixed(2)} = $${Math.round(q.value).toLocaleString('en-AU')} (${q.changePct == null ? 'n/a' : q.changePct.toFixed(2) + '%'} today, as of ${q.asOf})`).join('\n') : '';
    const params = {
      model: ai.model,
      max_tokens: 16000,
      system: live ? `${SYSTEM}\n\n<live_prices fetched="${prices.fetchedAt}">\nThese override the investment values in finance_data; recompute value, gain/loss and net worth from them.\n${live}\n</live_prices>` : SYSTEM,
      messages,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ANSWER_SCHEMA } }
    };
    // Anthropic's server-side refusal fallback is a first-party feature; the gateway has its own routing.
    const response = ai.gateway
      ? await ai.client.messages.create(params)
      : await ai.client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });

    if (response.stop_reason === 'refusal') {
      return res.json({ text: "I can't help with that one. Try asking about your spending, budgets, goals or investments.", stats: [], bars: [] });
    }
    const raw = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    let answer;
    try { answer = JSON.parse(raw); } catch { answer = { text: raw || 'Sorry, I could not work that out.', stats: [], bars: [] }; }
    res.json({
      text: String(answer.text || ''),
      stats: (answer.stats || []).slice(0, 3),
      bars: (answer.bars || []).slice(0, 4).map(b => ({ ...b, percent: Math.max(0, Math.min(100, Number(b.percent) || 0)) }))
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error('[ai] credentials rejected', err.status, err.message);
      return res.status(502).json({ error: ai.gateway ? 'AI Gateway rejected the request. Check AI Gateway is enabled and has credit in your Vercel dashboard.' : 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'The assistant is busy right now. Try again in a moment.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[ai]', err.status, err.message);
      return res.status(502).json({ error: 'The assistant hit an error. Try again.' });
    }
    console.error('[ai]', err);
    res.status(500).json({ error: 'Something went wrong talking to the assistant.' });
  }
});

// On Vercel the app runs as a function (export below); locally it's a normal server.
if (!HOSTED) {
  startPriceScheduler();
  app.listen(PORT, '127.0.0.1', async () => {
    const ai = await getAi();
    console.log(`Ledger running at http://localhost:${PORT}`);
    console.log(ai ? `AI assistant: on (${ai.model}${ai.gateway ? ' via AI Gateway' : ''})` : 'AI assistant: OFF. Add ANTHROPIC_API_KEY or AI_GATEWAY_API_KEY to .env');
    console.log(authConfig().enabled ? 'Password: on' : 'Password: OFF. Set APP_PASSWORD in .env to require sign-in');
  });
}

export default app;
