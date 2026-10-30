// Password gate shared by the Vercel proxy (proxy.js) and the local Express server.
// Uses Web Crypto only, so it runs in both. Sessions are a signed, expiring cookie;
// changing APP_PASSWORD (or AUTH_SECRET) signs everyone out.

export const COOKIE = 'ledger_session';
const SESSION_DAYS = 30, SHORT_HOURS = 12;

// Reachable without signing in: the login page and what it needs to render.
const PUBLIC = new Set(['/login', '/login.html', '/Login.dc.html', '/support.js', '/ai-client.js', '/favicon.ico', '/api/login', '/api/logout', '/api/session']);

const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function authConfig(env = process.env) {
  const password = env.APP_PASSWORD || '';
  return { password, secret: env.AUTH_SECRET || (password && `ledger:${password}`), enabled: !!password, hosted: !!env.VERCEL };
}

async function sign(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(cfg, attempt) {
  if (!cfg.enabled || typeof attempt !== 'string') return false;
  // Compare HMACs so the comparison takes the same time whatever the input length.
  const [a, b] = await Promise.all([sign(cfg.secret, `pw:${attempt}`), sign(cfg.secret, `pw:${cfg.password}`)]);
  return equal(a, b);
}

export async function createSession(cfg, remember) {
  const exp = Date.now() + (remember ? SESSION_DAYS * 864e5 : SHORT_HOURS * 36e5);
  const token = `${exp}.${await sign(cfg.secret, `session:${exp}`)}`;
  return { token, maxAge: remember ? SESSION_DAYS * 86400 : null };
}

export async function verifySession(cfg, token) {
  if (!cfg.enabled || !token) return false;
  const [exp, sig] = String(token).split('.');
  if (!(Number(exp) > Date.now()) || !sig) return false;
  return equal(sig, await sign(cfg.secret, `session:${exp}`));
}

export function readCookie(header, name = COOKIE) {
  const m = (header || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

export function sessionCookie(token, maxAge, secure) {
  return [`${COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', secure && 'Secure', maxAge != null && `Max-Age=${maxAge}`].filter(Boolean).join('; ');
}

export function clearCookie(secure) {
  return [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', secure && 'Secure', 'Max-Age=0'].filter(Boolean).join('; ');
}

// Decide what to do with a request: 'allow', 'deny-api' (401) or 'login' (redirect).
// Locally with no APP_PASSWORD the app stays open; when hosted it fails closed.
export async function gate(cfg, pathname, cookieHeader) {
  if (PUBLIC.has(pathname)) return 'allow';
  if (!cfg.enabled && !cfg.hosted) return 'allow';
  if (await verifySession(cfg, readCookie(cookieHeader))) return 'allow';
  return pathname.startsWith('/api/') ? 'deny-api' : 'login';
}
