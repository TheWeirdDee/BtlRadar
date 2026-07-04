# BTL Radar

**Three agents. One gateway. Zero rugs.**

BTL Radar is a real-time token security intelligence system built on the BTL Runtime. Paste any EVM or Solana contract address and watch three cascading AI agents — each routed through the BTL gateway — screen transactions, reason about anomalies, and deliver a plain-English verdict before you lose money.

Built for the BTL Runtime Hackathon · 

---

## What it does

You paste a contract address. The radar starts immediately.

**Agent 1 (Screener)** — runs on every single transaction via a fast cheap model routed through BTL. Screens for volume spikes, dev wallet movement, liquidity shifts, and gas anomalies. Costs almost nothing because it runs at scale.

**Agent 2 (Forensic)** — activates only when Agent 1 flags something suspicious. Inspects wallet history, deployer identity, cross-references known rug patterns. Routed to a mid-tier model via BTL.

**Agent 3 (Judge)** — fires only when Agent 2 confirms high risk. Produces a plain-English verdict with a rug probability score. Triggers alerts across web, Telegram, and X simultaneously. Uses the strongest model — but only when it actually matters.

The BTL cost widget shows, in real time, what this analysis would cost running GPT-4o for everything versus what it actually costs through BTL's cascading router. Typically 98–99% cheaper.

---

## Why BTL Runtime is the product

This system is architecturally impossible to build economically without a gateway like BTL Runtime.

Agent 1 processes thousands of transactions per session. At raw GPT-4o pricing that's prohibitive. BTL routes Agent 1 to the cheapest capable model, reducing per-transaction cost by ~95%. Agent 3 fires rarely — only on genuine escalations — and gets the strongest model. The routing intelligence is what makes the economics work.

The `x-btl-benchmark-cost`, `x-btl-customer-charge`, and `x-btl-saved` headers from every BTL response are surfaced directly in the UI as the cost widget. The savings aren't an abstraction — they're visible on every single scan.

---

## Distribution

| Surface | Handle | What it does |
|---------|--------|-------------|
| Web app | btl-radar.vercel.app | Full three-column radar with live transaction feed |
| Telegram | @BTLRadarBot | Tag in any group with a contract address |
| X | @BTLRadar | Tag in any thread with a contract address |

---

## Chains supported

- **EVM** — Ethereum, Base, BSC, Arbitrum (via Alchemy WebSocket)
- **Solana** — All SPL tokens (via Helius WebSocket)

---

## Tech stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **AI Gateway:** BTL Runtime (`api.badtheorylabs.com/v1`)
- **Agent 1:** `deepseek-v4-flash` via BTL (direct DeepSeek route)
- **Agent 2:** `deepseek-v4-pro` via BTL
- **Agent 3:** `deepseek-v4-pro` deep-reasoning pass via BTL
- **EVM data:** Alchemy WebSocket
- **Solana data:** Helius WebSocket
- **Telegram bot:** Telegraf.js
- **X bot:** X API v2
- **Deployment:** Vercel + Railway

---

## Setup

```bash
git clone https://github.com/yourusername/btl-radar
cd btl-radar
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

See `/docs/BUILD_PHASES.md` for the full 48-hour build plan.

---

## Environment variables

```env
BTL_API_KEY=
ALCHEMY_WS_URL=
HELIUS_API_KEY=
TELEGRAM_BOT_TOKEN=
X_BEARER_TOKEN=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

Built by Divine ([@TheWeirdDee](https://github.com/TheWeirdDee)) · Powered by [BTL Runtime](https://runtime.badtheorylabs.com)
