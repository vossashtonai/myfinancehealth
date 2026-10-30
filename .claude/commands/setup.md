---
description: Install, configure and launch the MyFinanceHealth (Ledger) app on this computer
---

Set up and run the MyFinanceHealth app for me, end to end. Read `README.md` and `CLAUDE.md` first.

1. Check Node.js is installed and is version 20 or newer (`node -v`). If it's missing or too old, stop and tell me how to install it from https://nodejs.org (LTS), then wait.
2. Run `npm install` in the project folder.
3. If `.env` doesn't exist, copy `.env.example` to `.env`.
4. Check whether `ANTHROPIC_API_KEY` in `.env` has a value. Don't print it. If it's empty, tell me:
   - the app works without it, but the AI Assistant will say it isn't configured;
   - to get a key, go to https://console.anthropic.com → API Keys → Create key;
   - to paste it into `.env` myself after `ANTHROPIC_API_KEY=` (never paste it into this chat).
   Then carry on; don't wait for the key.
   Also check `APP_PASSWORD`. If it's empty, tell me the app will run without a sign-in screen locally, and that I need to set one before deploying to Vercel. Ask whether I'd like to set one now; if I do, have me type it into `.env` myself.
5. Start the app with the `ledger` server in `.claude/launch.json` (preview_start if you have it, otherwise `npm run dev` in the background) and open http://localhost:3000.
6. Click through it to confirm it works: Dashboard, Transactions, Investments & Net Worth (check the "Live prices" line shows a time), and open the AI Assistant.
7. Tell me in a few lines what's running, where to open it, and anything that still needs my action (usually just the API key).
