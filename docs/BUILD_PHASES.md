# BTL Radar — 48-Hour Build Plan

**Hackathon:** BTL Runtime Hackathon · Jul 3–5, 2026  
**Submission deadline:** Jul 5 · 15:00 UTC  
**Stack:** Next.js · Tailwind · Node.js · BTL Runtime · Alchemy · Helius · Telegraf.js · X API v2

---

## Pre-Hackathon Checklist (Before Jul 3, 15:00 UTC)

- [ ] Register at runtime.badtheorylabs.com — get BTL API key + free credits
- [ ] Create Telegram bot via @BotFather → save token as `TELEGRAM_BOT_TOKEN`
- [ ] Create X account @BTLRadar → apply for X API v2 free tier → save Bearer token
- [ ] Create Alchemy account → get Ethereum/Base WebSocket URL (free tier)
- [ ] Create Helius account → get Solana WebSocket URL (free tier)
- [ ] Prepare mock transaction dataset (10 clean txs + 1 planted suspicious tx for demo)
- [ ] Set up GitHub repo: `btl-radar`
- [ ] Deploy base Next.js app to Vercel (empty shell)

---

## Phase 1 — Foundation (Hours 0–8 · Jul 3 15:00–23:00 UTC)

### Goal: Core BTL pipeline working end-to-end

**Hour 0–1: Project scaffold**
- [ ] `npx create-next-app@latest btl-radar --typescript --tailwind --app`
- [ ] Install deps: `axios`, `telegraf`, `ws`, `@helius-labs/helius-sdk`
- [ ] Set up `.env.local` with all API keys
- [ ] Deploy skeleton to Vercel

**Hour 1–3: BTL three-agent pipeline**
- [ ] Create `/api/scan` route — accepts contract address + chain
- [ ] Agent 1: BTL call with Llama 3 (`btl-2` router) — transaction screener prompt
- [ ] Agent 2: BTL call with GPT-4o mini — forensic analysis prompt (only fires if Agent 1 flags)
- [ ] Agent 3: BTL call with Claude Sonnet — verdict generation prompt (only fires if Agent 2 escalates)
- [ ] Parse BTL response headers: `x-btl-benchmark-cost`, `x-btl-customer-charge`, `x-btl-saved`
- [ ] Return structured JSON: `{ verdict, risk_score, flags, cost_data }`

**Hour 3–5: Transaction data feed**
- [ ] EVM: Alchemy WebSocket — subscribe to `alchemy_pendingTransactions` for target contract
- [ ] Solana: Helius WebSocket — subscribe to account transaction notifications
- [ ] Normalize both feeds into shared transaction schema: `{ hash, amount, wallet, timestamp, chain }`
- [ ] For demo: also build mock feed from pre-prepared JSON dataset

**Hour 5–8: Three-column UI (landing + app)**
- [ ] Landing page (from `/web/index.html` — port to Next.js)
- [ ] App page: three-column radar layout
- [ ] Column 1: live scrolling transaction feed with CLEAN/FLAGGED tags
- [ ] Column 2: Agent 2 analysis stream (shows when flagged)
- [ ] Column 3: Agent 3 verdict box with rug probability score (shows when escalated)
- [ ] BTL cost widget at bottom of columns

**Checkpoint:** paste a real contract address → see live transactions → one gets flagged → Agent 2 analysis appears → Agent 3 verdict fires

---

## Phase 2 — Polish + Bots (Hours 8–24 · Jul 4 00:00–15:00 UTC)

### Goal: Telegram bot working, X bot started, UI polished

**Hour 8–12: Telegram bot**
- [ ] `npm install telegraf`
- [ ] Create `telegram-bot/index.ts`
- [ ] Bot listens for messages containing a contract address (EVM `0x...` or Solana base58)
- [ ] On detect: run `/api/scan` pipeline
- [ ] Format response as Telegram message:
  ```
  🔍 BTL RADAR SCAN
  
  Contract: 0x4f2a...
  Chain: EVM
  
  ⚠️ HIGH RISK · 91% rug probability
  
  Dev wallet moved 41% of supply to a 3-day-old address.
  Liquidity dropped 34% in 6 minutes.
  Wallet linked to 4 prior rug pulls.
  
  DO NOT BUY. Exit if holding.
  
  Powered by BTL Runtime
  ```
- [ ] Deploy Telegram bot to Railway (free tier)
- [ ] Test: tag @BTLRadarBot in a group with a contract address

**Hour 12–18: X bot**
- [ ] X API v2 — set up mention webhook or polling
- [ ] Parse mentions containing a contract address
- [ ] Run `/api/scan` pipeline
- [ ] Format quote-tweet response (280 chars max):
  ```
  🔍 Scan complete: [address]
  
  ⚠️ HIGH RISK · 91% rug prob
  Dev wallet movement + liquidity drop detected.
  
  Powered by @BadTheoryLabs Runtime
  ```
- [ ] Deploy X bot alongside Telegram bot on Railway

**Hour 18–24: UI polish**
- [ ] Streaming responses — use `ReadableStream` to show Agent 2 analysis token by token
- [ ] Animate column activation (dormant → active → alert states)
- [ ] Add chain switcher (EVM / SOL tabs)
- [ ] BTL cost widget: animate counter as requests process
- [ ] Mobile responsive layout
- [ ] Error states: invalid address, unsupported chain, no data

---

## Phase 3 — Demo Prep + Hardening (Hours 24–40 · Jul 4 15:00–Jul 5 08:00 UTC)

### Goal: Demo never fails. Submission ready.

**Hour 24–28: Mock demo mode**
- [ ] Add `?demo=true` URL param that bypasses real chain data
- [ ] Load pre-prepared mock transaction feed from `/data/mock-feed.json`
- [ ] Planted suspicious transaction fires at T+45 seconds for reliable demo
- [ ] All three agents cascade on schedule
- [ ] Ensures demo works even if Alchemy/Helius has latency issues

**Hour 28–32: Real token testing**
- [ ] Test with 5 real EVM contract addresses (mix of safe and known rugged tokens)
- [ ] Test with $BTL Solana contract address (their own token — critical for demo)
- [ ] Test Telegram bot in a real group
- [ ] Test X bot with a real mention
- [ ] Fix any edge cases in address detection

**Hour 32–36: BTL cost dashboard**
- [ ] Make cost widget numbers real — pull from actual BTL response headers
- [ ] Show running total across all scans in current session
- [ ] Add "what this would cost on raw GPT-4o" calculation
- [ ] Show per-agent cost breakdown

**Hour 36–40: Stress test**
- [ ] Run 50 consecutive scans — check for rate limit issues
- [ ] Verify BTL credits are sufficient for demo day
- [ ] Test on mobile
- [ ] Test on slow connection

---

## Phase 4 — Submission (Hours 40–48 · Jul 5 08:00–15:00 UTC)

### Goal: Ship and win.

**Hour 40–44: Demo video**
- [ ] Record 2-min demo video
- [ ] Script:
  1. Open app (0:00–0:10)
  2. Paste $BTL Solana contract — "let's watch their own token" (0:10–0:25)
  3. Show clean transactions streaming through Agent 1 (0:25–0:45)
  4. Planted suspicious tx fires — Agent 1 flags it (0:45–1:00)
  5. Agent 2 wakes up — forensic analysis streams live (1:00–1:20)
  6. Agent 3 fires — RED ALERT verdict appears (1:20–1:40)
  7. Show BTL cost widget — "99% cheaper than running GPT-4o for everything" (1:40–2:00)
- [ ] Show Telegram bot working briefly at the end
- [ ] Keep under 2 minutes

**Hour 44–46: Write-up**
- [ ] README.md (from `/docs/README.md`)
- [ ] Devpost/submission description: one paragraph, plain English
- [ ] Architecture diagram

**Hour 46–48: Final checks**
- [ ] Vercel deployment live and stable
- [ ] Telegram bot online
- [ ] X bot online
- [ ] All env vars set in production
- [ ] Test live URL one final time
- [ ] Submit before 15:00 UTC Jul 5

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Next.js API routes |
| AI Gateway | BTL Runtime (`api.badtheorylabs.com/v1`) |
| Agent 1 | `btl-2` smart router (Llama 3 equivalent) |
| Agent 2 | `gpt-4o-mini` via BTL |
| Agent 3 | `claude-sonnet-4-5` via BTL |
| EVM Data | Alchemy WebSocket |
| Solana Data | Helius WebSocket |
| Telegram | Telegraf.js on Railway |
| X Bot | X API v2 on Railway |
| Deployment | Vercel (web) + Railway (bots) |

---

## Environment Variables

```env
# BTL Runtime
BTL_API_KEY=BTL_xxxx

# Blockchain data
ALCHEMY_WS_URL=wss://eth-mainnet.g.alchemy.com/v2/your-key
HELIUS_API_KEY=your-helius-key

# Bots
TELEGRAM_BOT_TOKEN=your-bot-token
X_BEARER_TOKEN=your-x-bearer-token
X_API_KEY=your-x-api-key
X_API_SECRET=your-x-secret
X_ACCESS_TOKEN=your-access-token
X_ACCESS_SECRET=your-access-secret

# App
NEXT_PUBLIC_APP_URL=https://btl-radar.vercel.app
```

---

## Demo Day Script (Jul 5 · 17:00 UTC)

1. Open `btl-radar.vercel.app` — show landing page
2. Click "Launch Radar"
3. Select SOL tab
4. Paste $BTL contract address live
5. Say: *"We're watching Bad Theory Labs' own token with a tool built on their own infrastructure"*
6. Watch clean transactions flow through Agent 1
7. Planted suspicious tx fires — all three agents cascade
8. Point to BTL cost widget: *"Agent 1 handled 1,200 transactions for almost nothing. Agent 3 only fired once — when it mattered. That's what BTL Runtime makes possible."*
9. Pull out phone — show Telegram bot receiving the same alert
10. Done.
