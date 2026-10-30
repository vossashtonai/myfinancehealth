// Shared client for the AI assistant (slide-out panel in Dashboard + full Assistant page).
// history: [{ u: boolean, text: string }] as kept in component state.
window.ledgerAsk = async function ledgerAsk(history) {
  const messages = history
    .filter(m => m.text && !m.pending && !m.error)
    .map(m => ({ role: m.u ? 'user' : 'assistant', content: m.text }));
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { text: data.error || 'The assistant is unavailable right now.', stats: [], bars: [], error: true };
    return data;
  } catch (e) {
    return { text: "Can't reach the Ledger server. Is it still running?", stats: [], bars: [], error: true };
  }
};
