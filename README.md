# MyFinanceHealth: Ledger

A personal finance dashboard designed in **Claude Design** and turned into a working app with **Claude Code**. It has:

- **10 screens:** Dashboard, Transactions, Budget, Income, Projections, Goals, Investments & Net Worth, FIRE Calculator, AI Assistant and Settings, each in light and dark mode.
- **AI Assistant:** a real Claude-powered chat that answers questions about the finances in the app. Use the slide-out panel (press **K**) or the full AI Assistant page.
- **Live investment prices:** ETF (ASX) and Bitcoin prices refresh every day, and value, gain/loss, allocation and net worth recalculate automatically.

Everything runs on your own computer at `http://localhost:3000`. It uses sample data for "Alex" so you can explore straight away.

---

## Quick start with Claude (recommended)

You need the **Claude desktop app** (Code tab) or **Claude Code** in a terminal, plus **Node.js 20+** from [nodejs.org](https://nodejs.org), using the LTS version.

1. **Get your own copy of this repo.** On GitHub, click **Use this template → Create a new repository** (keep it private).
2. **Open it in Claude.**
   - *Claude desktop app:* in the Code tab, start a new session and choose your repo (or clone it and open the folder).
   - *Terminal:* `git clone <your-repo-url>`, `cd` into it, then run `claude`.
3. **Type `/setup`.** Claude installs everything, creates your `.env`, starts the app and opens it in the preview pane.
4. **Add your API key** so the AI Assistant can answer (see below).

## Manual setup

```bash
npm install
cp .env.example .env
npm run dev
```

Then open http://localhost:3000.

## Turning on the AI Assistant

The assistant calls the Claude API with **your own** key. The app works without a key, but the assistant will say it isn't configured until you add one.

1. Go to [console.anthropic.com](https://console.anthropic.com), open **API Keys**, then **Create key**. The API has usage-based billing, so add a small amount of credit.
2. Open `.env` in the project folder and paste the key after `ANTHROPIC_API_KEY=`.
3. Restart the app (stop and re-run `npm run dev`, or ask Claude to restart it).

> Never paste your key into a chat, a screenshot or a commit. `.env` is git-ignored for that reason.

Optional settings in `.env`:

| Setting | Default | What it does |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | The model the assistant uses. `claude-sonnet-5-5` or `claude-haiku-5-5` are cheaper. |
| `PORT` | `3000` | The local port. |

## Try it

- **Ask the assistant:** "Where did I overspend this month?", "How am I tracking for my house deposit?", "What's my FIRE number if I cut dining out by half?"
- **Investments:** click **Refresh prices** to pull the latest ETF and crypto prices.
- **Keyboard shortcuts:** **K** opens the assistant, **N** opens a new transaction, **/** searches transactions, **Esc** closes.
- **Light and dark mode:** use the toggle in the top bar.
- **Design canvas:** http://localhost:3000/review shows every screen side by side.

## Make it yours

Ask Claude to do these for you in plain English, e.g. *"change my ETF holdings to 200 units of VAS"*.

- **Your investments:** edit `LIVE_HOLDINGS` in `lib/prices.js`. ASX tickers end in `.AX` (e.g. `VAS.AX`); crypto uses CoinGecko ids (e.g. `ethereum`).
- **Your numbers:** the sample data lives in each screen's script inside `public/*.dc.html`. The AI assistant reads its copy from `lib/finance-context.js`, so keep the two in step.
- **The design:** each screen in `public/` is a Claude Design file. Keep the markup as it is and change the logic in its `<script data-dc-script>` block.

## How it works

```
public/            Claude Design screens (*.dc.html) + design runtime (support.js)
public/ai-client.js  Browser → /api/chat
server.js          Express server: static files, /api/chat (Claude), /api/prices
lib/finance-context.js  The data the assistant answers from
lib/prices.js      Daily price fetcher (Yahoo Finance + CoinGecko), cached in data/
.claude/           /setup command + preview config for Claude
```

The assistant uses Claude's structured JSON output, so its answers render as the design's text, stat cards and progress bars. Your API key only ever lives on the server.

## Notes and limits

- **Sample data:** this is "Demo mode". Adding a transaction validates and confirms but isn't saved yet, and the login screens are part of the design rather than real authentication.
- **Price feeds:** Yahoo Finance's price feed is free but unofficial. If it ever stops working, swap in a paid price API in `lib/prices.js`.
- **Not financial advice:** the assistant gives general information only.
