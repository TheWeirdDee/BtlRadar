# BTL Radar — Product Requirements Document

**Version:** 1.0  
**Date:** July 1, 2026  
**Hackathon:** BTL Runtime Hackathon · Jul 3–5, 2026  
**Author:** Divine ([@TheWeirdDee](https://github.com/TheWeirdDee))  
**Deadline:** Jul 5, 2026 · 15:00 UTC  

---

## 1. Overview

### 1.1 Product Summary

BTL Radar is a real-time token security intelligence system that watches any EVM or Solana token contract and alerts users to rug pull risk before they lose money. Users paste a contract address, and three cascading AI agents — routed through the BTL Runtime gateway — screen every transaction, reason about anomalies, and deliver a plain-English verdict in under 10 seconds.

The product ships across three surfaces: a web dashboard, a Telegram bot, and an X bot. All three share the same three-agent BTL pipeline and a persistent memory layer that tracks how a token's risk profile changes over time.

### 1.2 Problem

People lose money to crypto token scams daily. The existing tools (Token Sniffer, Honeypot.is, DEXTools) are rule-based — they check static contract properties against a fixed list of known patterns. They fail against novel rug mechanics because they cannot reason, only match.

The other failure mode: these tools are one-shot. You check a token once before buying. But rugs don't happen at the moment you buy — they happen over time, as dev wallets move, liquidity drains, and suspicious patterns accumulate. Nobody is watching continuously.

The result: people either don't check at all (too much friction), get a false SAFE verdict from a rule-based tool, or check once and never again — missing the signals that appear later.

### 1.3 Solution

Three AI agents, each with a specific job, running in sequence through BTL's multi-provider gateway:

- **Agent 1** screens every transaction cheaply and continuously. 99% of transactions are noise. This agent handles all of it at near-zero cost by routing through the cheapest capable model via BTL.
- **Agent 2** activates only when Agent 1 flags something. It reasons about the specific anomaly — wallet history, deployer identity, liquidity patterns — and decides whether to escalate.
- **Agent 3** fires only when Agent 2 confirms high risk. It produces a plain-English verdict with a rug probability score and triggers alerts.

Persistent memory (Supabase, simulating RetainDB) means every scan is stored. When a user checks a token they've scanned before, they see how the risk profile has changed — "risk increased from 34% to 91% since your last scan 3 days ago." That's continuous intelligence, not a one-shot check.

### 1.4 Why BTL Runtime is Structurally Necessary

The three-agent cascading architecture only makes economic sense with a gateway like BTL Runtime. Agent 1 processes thousands of transactions per session. At raw GPT-4o pricing, that's prohibitively expensive. BTL routes Agent 1 to the cheapest capable model, reducing per-transaction cost by ~95%. Agent 3 uses the strongest model — but fires rarely, only on genuine escalations.

Without BTL's multi-provider routing, you either run everything on a cheap model (poor verdict quality) or everything on an expensive model (economically unviable at transaction-processing scale). BTL makes both quality and cost work simultaneously. The runtime is not decorative — it is the architecture.

---

## 2. Goals

### 2.1 Hackathon Goals
- Win 1st place ($500) at the BTL Runtime Hackathon
- Win the $100 "Best Use of Runtime" spot prize
- Ship a working product across all three surfaces (web, Telegram, X) within 48 hours

### 2.2 Product Goals
- Deliver a verdict on any EVM or Solana token in under 10 seconds
- Achieve zero-setup UX: paste address, get verdict, no wallet connection required
- Make BTL Runtime's cost savings visible and real via the live cost widget
- Demonstrate persistent memory: show risk trend changes across multiple scans of the same token

### 2.3 Non-Goals
- This is not a trading bot — it does not execute trades
- This is not a wallet manager — it does not require wallet connection
- This is not a comprehensive audit tool — it screens for rug risk, not full smart contract security

---

## 3. Users

### 3.1 Primary User

**Retail crypto trader / memecoin participant**

- Age: 18–35
- Spends significant time in Telegram crypto groups and on X Crypto Twitter
- Has been rugged before or knows someone who has
- Currently uses Telegram trading bots (Maestro, Trojan, BullX) for execution
- Does not read smart contract code
- Makes fast decisions based on social signals and basic token metrics
- Pain: no reliable, fast way to know if a token is safe before buying — current tools are either too slow, too technical, or too easy to fool

### 3.2 Secondary User

**Crypto group admin / community moderator**

- Runs a Telegram group where contract addresses are shared daily
- Wants to protect community members from scams
- Will add @BTLRadarBot to their group permanently if it provides reliable verdicts
- Distribution multiplier: one admin adoption = hundreds of users protected

### 3.3 Tertiary User

**Developer / builder in BTL ecosystem**

- Attending the hackathon, evaluating BTL Runtime
- Wants to see real-world applications of the gateway
- Judges for the hackathon fall into this category

---

## 4. Features

### 4.1 Core Feature: Three-Agent Scan Pipeline

**Description:** The central product mechanic. Takes a contract address, runs it through three sequential AI agents via BTL Runtime, returns a structured verdict.

**Inputs:**
- Contract address (EVM `0x...` or Solana base58)
- Chain selection (EVM / SOL)
- Recent transaction data (from Alchemy/Helius WebSocket or mock feed)

**Agent 1 — High-Speed Screener**
- Model: `btl-2` smart router (BTL selects cheapest capable model)
- Processes 100% of incoming transactions
- Screens for: volume spikes, dev wallet movement, gas anomalies, liquidity shifts, new wallet activity
- Output: `{ flagged: boolean, suspicious_hashes: [], flags: [], confidence: 0-100 }`
- If not flagged → return SAFE verdict immediately, no further agents run
- Cost: ~$0.0001 per transaction batch

**Agent 2 — Forensic Analyst**
- Model: `gpt-4o-mini` via BTL
- Activates only when Agent 1 flags something
- Analyzes: wallet age, deployer history, liquidity lock status, token approval patterns, cross-reference against known rug wallet signatures
- Output: `{ escalate: boolean, risk_level: LOW/MEDIUM/HIGH/CRITICAL, findings: [], wallet_risk: 0-100 }`
- If risk_level LOW → return RISKY verdict, Agent 3 does not run
- Cost: ~$0.001 per forensic analysis

**Agent 3 — Tactical Judge**
- Model: `claude-sonnet-4-5` via BTL
- Activates only when Agent 2 confirms HIGH or CRITICAL risk
- Produces: plain-English summary, rug probability score, specific action recommendation
- Triggers alerts across all three surfaces simultaneously
- Output: `{ verdict: SAFE/RISKY/TRAP, rug_probability: 0-100, summary: string, action: string, key_evidence: [] }`
- Cost: ~$0.005 per verdict

**Total cost per scan (typical):** ~$0.0001–0.006 depending on escalation depth
**Benchmark cost (all GPT-4o):** ~$0.15–0.20 per scan
**Savings:** 97–99%

### 4.2 Core Feature: Live Three-Column UI

**Description:** The primary visual of the web app. Three columns representing the three agents, showing their state in real time.

**Column states:**
- DORMANT: agent not yet active (dark, pulsing dot)
- ACTIVE: agent processing (green, streaming text)
- ALERT: agent escalated (red, flashing)

**Column 1 — Transaction Feed**
- Scrolling list of recent transactions for the scanned contract
- Each transaction tagged: CLEAN (green) / SCANNING (grey) / FLAGGED (yellow)
- Updates in real time as new transactions arrive via WebSocket

**Column 2 — Forensic Analysis**
- Hidden until Agent 1 flags something
- Streams Agent 2's analysis token by token using ReadableStream
- Shows: wallet age, deployer match, liquidity delta, pattern matches

**Column 3 — Verdict**
- Hidden until Agent 2 escalates
- Shows: verdict badge (SAFE / RISKY / TRAP), rug probability score, plain-English summary, recommended action, key evidence list

**BTL Cost Widget (below columns)**
- Always visible
- Shows live: benchmark cost / actual cost / total saved / requests routed
- Numbers pulled from real BTL response headers: `x-btl-benchmark-cost`, `x-btl-customer-charge`, `x-btl-saved`
- Counter animates as requests process

### 4.3 Feature: Persistent Scan Memory

**Description:** Every scan is stored. When a contract is scanned again, the app retrieves its history and shows how risk has changed.

**Memory fields stored per scan:**
- Contract address, chain, verdict, risk score, flags, key evidence
- Per-agent costs, escalation path
- Timestamp

**Memory retrieval:**
- On each new scan, query history for that contract address
- If previous scans exist: calculate risk delta, trend direction, days since first scan
- Surface in UI as a "memory banner" above the three columns

**Memory banner examples:**
- "First scan — no previous history"
- "Risk increased from 34% to 91% since last scan 3 days ago"
- "Previously SAFE (12% risk) · Now RISKY (67% risk) · 2 scans total"
- "Risk stable — scanned 5 times, consistently SAFE"

**Storage:** Supabase (simulating RetainDB)  
**Retention:** Indefinite within hackathon scope

### 4.4 Feature: Telegram Bot (@BTLRadarBot)

**Description:** Bot lives in any Telegram group or DM. Detects contract addresses posted in messages and responds with a verdict.

**Trigger:** Any message containing an EVM address (`0x` followed by 40 hex chars) or Solana address (base58, 32–44 chars)

**Response format:**
```
🔍 BTL RADAR SCAN

Contract: 0x4f2a...
Chain: EVM

⚠️ HIGH RISK · 91% rug probability

Dev wallet moved 41% of supply to a 3-day-old address.
Liquidity dropped 34% in 6 minutes.

→ DO NOT BUY. Exit if holding.

Evidence:
• Deployer wallet linked to 4 prior rugs
• Unlimited token approval granted to unknown contract
• Liquidity lock expired 2 days ago

BTL cost: $0.004 (saved 97% vs raw GPT-4o)
Powered by BTL Runtime
```

**Behavior:**
- Responds inline (reply to the message containing the address)
- Shows "scanning..." message immediately, edits to verdict when complete
- Silent on messages without contract addresses
- Works in groups and DMs

**Commands:**
- `/start` — welcome message and instructions
- `/help` — command list

### 4.5 Feature: X Bot (@BTLRadar)

**Description:** Monitors X for mentions containing a contract address. Responds with a quote-tweet verdict.

**Trigger:** Any mention of @BTLRadar containing a contract address

**Response format (280 chars max):**
```
🔍 Scan: 0x4f2a...8c91 (EVM)

🚨 HIGH RISK · 91% rug probability

Dev wallet moved 41% of supply. Liquidity dropped 34%.

→ Exit now.

Powered by @BadTheoryLabs Runtime
btl-radar.vercel.app
```

**Polling:** Every 60 seconds (X free tier rate limit compliance)

**Rate limits:** 1,500 tweets/month on free tier — sufficient for hackathon

---

## 5. User Flows

### 5.1 Web App — New Scan

```
User opens btl-radar.vercel.app
→ Sees landing page with contract address input
→ Pastes contract address
→ Selects chain (EVM or SOL)
→ Clicks "Scan →"
→ Three columns appear
→ Column 1: transactions start flowing in real time
→ Agent 1 processes each transaction (green CLEAN tags)
→ A suspicious transaction appears (yellow FLAGGED tag)
→ Column 2 activates — forensic analysis streams in
→ Agent 2 finds high risk — escalates
→ Column 3 activates — verdict appears with red TRAP badge
→ BTL cost widget shows: $0.004 actual vs $0.18 benchmark
→ Memory banner shows: "First scan for this contract"
→ User copies verdict or shares link
```

### 5.2 Web App — Returning Token

```
User pastes a previously scanned contract address
→ Memory banner appears: "Scanned 3 days ago — risk was 34%"
→ New scan runs
→ Verdict: 91% risk
→ Memory banner updates: "⚠️ Risk increased by 57% since last scan"
→ User sees the token deteriorated while they weren't watching
```

### 5.3 Telegram — Group Scan

```
Someone posts a contract address in a Telegram group
→ @BTLRadarBot (already in the group) detects it
→ Bot replies inline: "Scanning 0x4f2a... via BTL Runtime..."
→ 8 seconds later, message edits to full verdict
→ Entire group sees the verdict before anyone buys
```

### 5.4 X — Thread Scan

```
User sees a contract address posted in a thread on X
→ Replies to the tweet: "@BTLRadar check this [address]"
→ @BTLRadar quote-tweets the original with verdict
→ Everyone following the thread sees it
```

---

## 6. Technical Architecture

### 6.1 System Overview

```
[User / Telegram / X]
         │
         ▼
[BTL Radar Web App — Next.js on Vercel]
         │
         ├── [Alchemy WebSocket] ← EVM transaction feed
         ├── [Helius WebSocket]  ← Solana transaction feed
         │
         ▼
[/api/scan — Three-Agent Pipeline]
         │
         ├── Agent 1: btl-2 via BTL Runtime /v1/chat/completions
         │     └── If flagged ↓
         ├── Agent 2: gpt-4o-mini via BTL Runtime /v1/chat/completions
         │     └── If escalated ↓
         └── Agent 3: claude-sonnet-4-5 via BTL Runtime /v1/chat/completions
                   └── BTL cost headers extracted from every response
         │
         ├── [Supabase] ← Save scan result (RetainDB simulation)
         │                  Retrieve scan history for memory context
         │
         └── Return: verdict + risk score + cost data + memory context

[Telegram Bot — Telegraf.js on Railway]
         └── Calls /api/scan → formats → replies inline

[X Bot — X API v2 on Railway]
         └── Polls mentions → calls /api/scan → quote-tweets verdict
```

### 6.2 BTL Runtime Integration

**Endpoint:** `https://api.badtheorylabs.com/v1/chat/completions`  
**Auth:** `Authorization: Bearer BTL_xxxx`  
**Models used:**
- Agent 1: `btl-2` (BTL smart router)
- Agent 2: `gpt-4o-mini`
- Agent 3: `claude-sonnet-4-5`

**Response headers consumed:**
- `x-btl-benchmark-cost` → what it would cost at full-price model
- `x-btl-customer-charge` → what BTL actually charged
- `x-btl-saved` → the savings
- `x-btl-cache-tier` → whether response was cached

### 6.3 Data Models

**Scan Record (Supabase)**
```typescript
{
  id: UUID
  contract_address: string
  chain: 'EVM' | 'SOL'
  verdict: 'SAFE' | 'RISKY' | 'TRAP'
  risk_score: number (0-100)
  summary: string
  flags: string[]
  key_evidence: string[]
  agent1_cost: number
  agent2_cost: number | null
  agent3_cost: number | null
  actual_cost: number
  benchmark_cost: number
  saved: number
  escalated_to_agent2: boolean
  escalated_to_agent3: boolean
  scanned_at: timestamp
}
```

### 6.4 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + Tailwind | Fast, Vercel-native |
| AI Gateway | BTL Runtime | Required, multi-provider routing |
| EVM data | Alchemy WebSocket | Free tier, reliable, real-time |
| Solana data | Helius WebSocket | Best Solana tx streaming |
| Memory | Supabase | Free tier, instant setup, RetainDB simulation |
| Telegram | Telegraf.js | Best Node.js Telegram library |
| X | twitter-api-v2 | Official X API v2 wrapper |
| Bot hosting | Railway | Free tier, always-on |
| Web hosting | Vercel | Free tier, instant deploys |

---

## 7. Design

### 7.1 Design Language

Matches BTL's own aesthetic: dark background (#0a0a0a), IBM Plex Mono for all UI chrome, stark minimal layout, no border radius, grid-based structure. The product should look like it belongs to the BTL family — judges should feel visual continuity between the runtime docs and this product.

### 7.2 Color System

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #0a0a0a | Base |
| Surface | #111111 | Cards, columns |
| Border | #1e1e1e | All borders |
| Text | #e8e8e8 | Primary text |
| Muted | #666666 | Secondary text, labels |
| Green | #00ff88 | SAFE, CLEAN, active state |
| Yellow | #f5c518 | FLAGGED, RISKY, warning state |
| Red | #ff3b3b | TRAP, ALERT, critical state |
| White | #ffffff | CTAs, headings |

### 7.3 Typography

- **Display / UI chrome:** IBM Plex Mono — all navigation, labels, stats, column headers, cost widget
- **Body:** IBM Plex Sans Light — descriptions, summaries, verdict text

### 7.4 Key UI Moments

1. **The cascade** — watching three columns activate in sequence is the signature moment. Column 1 is alive from the start. Column 2 snaps awake when something is flagged. Column 3 fires red when escalated. Each state transition is the story.

2. **The cost widget** — always visible, always ticking. Makes BTL's value proposition tangible in real time. Not a feature footnote — a headline UI element.

3. **The memory banner** — appears above the columns when a previously scanned token is detected. Simple, stark, shows the risk delta immediately.

---

## 8. Success Metrics (Hackathon Scope)

| Metric | Target |
|--------|--------|
| Scan latency (end-to-end) | < 10 seconds |
| Demo reliability | Zero failures in 2-min demo |
| Surfaces live at submission | 3 (web + Telegram + X) |
| BTL features used | /v1/chat/completions, multi-provider routing, cost headers, streaming |
| Chains supported | 2 (EVM + Solana) |
| Judges can use it without instructions | Yes |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Alchemy/Helius WebSocket latency during demo | Mock feed with pre-planted suspicious tx fires at T+45s reliably |
| BTL API rate limits | Stay within free credit allocation; mock agent calls for stress testing |
| X API approval delay | Apply before July 3rd; web + Telegram alone are sufficient to win |
| Agent JSON parse failures | Try/catch with fallback responses on all three agents |
| Supabase cold start | Warm up with a test scan before demo |
| BTL credits running out during demo | Monitor usage; demo uses mock feed which costs ~$0.01 total |

---

## 10. Out of Scope (Post-Hackathon)

- Real-time push notifications (email, SMS)
- User accounts and saved watchlists
- Historical chart of token risk over time
- Integration with trading bots (auto-exit on TRAP verdict)
- RetainDB native integration if/when access granted
- Support for additional chains (TON, Aptos, Sui)
- Mobile app

---

## 11. Timeline

| Phase | Hours | Dates (UTC) |
|-------|-------|-------------|
| Pre-hackathon prep | — | Jul 1–3 |
| Phase 1: Foundation | 0–8 | Jul 3 15:00 – Jul 3 23:00 |
| Phase 2: Bots + Polish | 8–24 | Jul 4 00:00 – Jul 4 15:00 |
| Phase 3: Demo prep | 24–40 | Jul 4 15:00 – Jul 5 08:00 |
| Phase 4: Submission | 40–48 | Jul 5 08:00 – Jul 5 15:00 |
| Demo day | — | Jul 5 17:00 UTC |
| Winners announced | — | Jul 5 20:00 UTC |

See `BUILD_PHASES.md` for hourly breakdown.

---

## 12. Submission Checklist

- [ ] Web app live at btl-radar.vercel.app
- [ ] Telegram bot @BTLRadarBot online and responding
- [ ] X bot @BTLRadar online and responding to mentions
- [ ] GitHub repo public with README
- [ ] 2-minute demo video recorded and uploaded
- [ ] Submission form filled on hackathon platform
- [ ] Submitted before Jul 5 · 15:00 UTC

---

*BTL Radar · Built for the BTL Runtime Hackathon · Bad Theory Labs · Lagos · 2026*
