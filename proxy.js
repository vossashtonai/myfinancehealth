// Vercel Routing Middleware: runs before every request (including the static screens in public/)
// and sends anyone without a valid session to the login page.
import { next } from '@vercel/functions';
import { authConfig, gate } from './lib/auth.js';

export default async function proxy(request) {
  const url = new URL(request.url);
  const decision = await gate(authConfig(), url.pathname, request.headers.get('cookie'));
  if (decision === 'allow') return next();
  if (decision === 'deny-api') {
    return new Response(JSON.stringify({ error: 'Sign in to use Ledger.' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }
  const login = new URL('/login', url);
  if (url.pathname !== '/') login.searchParams.set('next', url.pathname);
  return Response.redirect(login, 302);
}
