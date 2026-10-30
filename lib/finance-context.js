// Snapshot of the data the Ledger screens render (public/*.dc.html).
// The assistant answers from this, so keep it in sync when the screen data changes
// (or replace it with a live read from the connected Google Sheet later).

export const FINANCE_CONTEXT = `
User: Alex, age 29, renting in Surry Hills, Sydney. All amounts AUD. Today is 30 Oct 2026.
Accounts: Everyday (ING Orange Everyday), Savings, Business Draws, Investment. Data syncs from a connected Google Sheet.

## Monthly income & expenses (last 12 months, Nov 2025 – Oct 2026)
Month | Income | Expenses | Saved
Nov 2025 | 9,840 | 4,380 | 5,460
Dec 2025 | 10,120 | 5,060 | 5,060
Jan 2026 | 9,610 | 4,290 | 5,320
Feb 2026 | 9,790 | 4,410 | 5,380
Mar 2026 | 9,930 | 4,520 | 5,410
Apr 2026 | 9,705 | 5,620 | 4,085
May 2026 | 10,040 | 4,350 | 5,690
Jun 2026 | 9,880 | 4,470 | 5,410
Jul 2026 | 9,655 | 5,180 | 4,475
Aug 2026 | 9,970 | 4,440 | 5,530
Sep 2026 | 9,815 | 4,610 | 5,205
Oct 2026 | 9,912.40 | 4,563.85 | 5,348.55
Savings rate Oct 2026: 54%. Quarter Aug–Oct: income $29,697, expenses $13,614, saved $16,083 (54%).

## Income sources
- Business Owner's Draws (Studio Pty Ltd): $8,500/month, paid as $4,250 on the 1st and 15th.
- Side income (consulting, YouTube AdSense), monthly Nov→Oct: 1172, 1445, 940, 1118, 1252, 1024, 1364, 1197, 976, 1285, 1135, 1240. Oct: Northwind Studio consulting $640 (Invoice #0142), YouTube AdSense $600.
- Interest & dividends (UBank), monthly Nov→Oct: 168, 175, 170, 172, 178, 181, 176, 183, 179, 185, 180, 172.40.

## October 2026 budget (category | budget | spent Oct | spent Sep)
Rent | 2,400 | 2,400 | 2,400 (fixed)
Groceries | 650 | 725.85 | 668  ← OVER budget by $75.85 (112%), mostly two larger shops in the second week
Dining Out | 380 | 342 | 417
Transport | 220 | 212 | 236
Utilities & Internet | 210 | 206 | 214
Phone | 65 | 65 | 65 (fixed)
Subscriptions | 95 | 95 | 95 (fixed)
Health & Fitness | 140 | 140 | 142
Shopping | 180 | 180 | 164
Entertainment | 120 | 108 | 119
Insurance | 90 | 90 | 90 (fixed)
October spending split: Rent 2,400 · Groceries 725.85 · Dining Out 342 · Transport 212 · Utilities 206 · Other 678. Total 4,563.85.

## October 2026 transactions (day, merchant, category, amount)
30 Woolworths Metro, Groceries, -86.40 | 23 Coles Broadway, Groceries, -112.35 | 18 Aldi Marrickville, Groceries, -154.20 | 12 Woolworths Town Hall, Groceries, -168.55 | 6 Harris Farm Markets, Groceries, -92.10 | 2 Coles Broadway, Groceries, -112.25
28 Single O Café, Dining Out, -18.50 | 21 Mr Wong, Dining Out, -146.00 (Birthday dinner) | 19 Bourke Street Bakery, Dining Out, -24.60 | 11 Bills Surry Hills, Dining Out, -68.40 | 4 Gelato Messina, Dining Out, -22.50 | 14 Chin Chin, Dining Out, -62.00
29 Ampol Surry Hills, Transport, -72.15 | 17 Uber, Transport, -28.40 | 9 Opal top-up, Transport, -40.00 | 3 BP Alexandria, Transport, -71.45
20 AGL Energy, Utilities, -121.00 | 8 Aussie Broadband, Utilities, -85.00 | 24 Telstra, Phone, -65.00
27 Netflix, -18.99 | 15 Spotify, -13.99 | 5 Adobe Creative Cloud, -62.02 (Subscriptions)
1 Anytime Fitness, -64.95 | 16 Chemist Warehouse, -75.05 (Health & Fitness)
25 Bunnings Warehouse, Shopping, -54.80 | 13 Uniqlo Pitt St, Shopping, -125.20 | 26 Event Cinemas, Entertainment, -46.00 | 10 Ticketek, Entertainment, -62.00
7 NRMA Insurance, -90.00 | 1 Rent · Ray White Surry Hills, -2,400.00
1 & 15 Owner's draw · Studio Pty Ltd, +4,250 each | 28 Northwind Studio consulting, +640 | 21 YouTube AdSense, +600 | 30 UBank interest, +172.40

## Goals
- House Deposit: saved $68,400 of $120,000 (57%), target Dec 2028. Contributing ~$2,500/month vs $2,060/month needed → on course for ~Aug 2028, about 4 months early. Passed 50% in Aug 2026. Balance by month Nov→Oct: 38400, 40900, 43400, 45900, 48400, 50900, 53400, 55900, 58400, 63700, 65900, 68400. Held in UBank High-Interest Savings.
- Emergency Fund: $25,000 of $25,000 (100%), completed Aug 2026. ING Savings Maximiser.
- Europe Trip: $4,850 of $12,000 (40%), target Jun 2027. Behind — needs +$100/month.
- Car Upgrade: $7,200 of $30,000 (24%), target Mar 2028. On track at $1,340/month.

## Investments & net worth
Holding | Detail | Cost base | Value | Updated
Vanguard Diversified High Growth | VDHG · ASX, 645 units | 34,800 | 42,300 | 28 Oct
iShares S&P 500 | IVV · ASX, 310 units | 15,200 | 18,650 | 28 Oct
AustralianSuper | Balanced option | 52,400 | 64,200 | 30 Sep
Bitcoin | 0.062 BTC on Swyftx | 6,100 | 9,800 | 28 Oct
High-Interest Savings | UBank, house deposit | — | 68,400 | 30 Oct
Emergency Fund | ING Savings Maximiser | — | 25,000 | 30 Oct
Everyday account | ING Orange Everyday | — | 6,200 | 30 Oct
Net worth by month Nov 2025→Oct 2026: 155000, 158900, 162100, 166800, 170400, 174200, 179500, 184300, 189600, 195100, 203930, 208750. Current net worth $208,750 (+$53,750 over 12 months; +$19,150 over Aug–Oct).

## FIRE calculator defaults
Annual expenses $54,000, safe withdrawal rate 4% → FIRE number $1,350,000. Invested assets counted toward FIRE $134,950. Contributions $2,000/month ($24,000/yr). Expected return 7%, inflation 2.5%. Current age 29, renting, super included. Progress ~10%. Projected FIRE age ~47.
Halving dining out (~$190/month, ~$2,280/yr) → expenses $51,720, FIRE number ~$1,293,000 (−$57,000), FIRE age ~46.
FIRE number = annual expenses / SWR. Years to FIRE: grow assets at 7%/yr plus annual contributions until they reach the FIRE number.

## Projections
Base case next 5 years: owner's draws $8,500/month, side income ~$1,180–1,250/month growing ~1.4%/yr, interest ~$180/month, expenses ~$4,420–4,950/month (December highest) growing ~2.4%/yr.
`.trim();
