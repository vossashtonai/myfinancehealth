# MyFinanceHealth (Ledger)

Personal finance dashboard: a Claude Design prototype running as a real local app, with a Claude-powered AI assistant and live ETF/crypto prices.

## Run

- `npm install`, then `npm run dev`. The app is at http://localhost:3000 (design review canvas at `/review`).
- `.claude/launch.json` defines the `ledger` dev server for the desktop app's preview pane.
- New users: run `/setup`.

## Layout

- `public/*.dc.html`: the screens, exported from Claude Design. Each has an `<x-dc>` template plus a `<script type="text/x-dc" data-dc-script>` with a `class Component extends DCLogic`. `{{ name }}` in the template binds to what `renderVals()` returns. `<sc-if>` and `<sc-for>` are conditionals and loops. `<dc-import name="X">` loads `X.dc.html`.
- `public/support.js`: the generated design runtime (loads React from unpkg). Don't edit it.
- `public/ai-client.js`: `window.ledgerAsk(history)` → `POST /api/chat`.
- `server.js`: Express. Serves `public/` and handles `/api/chat` (Claude with JSON-schema output: `text`, `stats`, `bars`), `/api/prices` and `/api/prices/refresh`.
- `lib/finance-context.js`: the financial data the assistant answers from. It mirrors the sample data shown on the screens.
- `lib/prices.js`: live prices (Yahoo Finance for ASX ETFs, CoinGecko for crypto). Cached in `data/prices.json` and refreshed daily after 4:30pm Brisbane time. Holdings and units are in `LIVE_HOLDINGS`.

## Conventions

- Keep the design intact. Change behaviour in the `data-dc-script` logic and add `{{ bindings }}` to templates rather than restructuring the markup.
- Each screen holds its own sample data. If you change figures, update `lib/finance-context.js` so the assistant stays consistent.
- The API key lives only in `.env` on the server. Never send it to the browser and never commit `.env`.
