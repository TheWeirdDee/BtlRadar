'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SonarRadarBg from '@/components/SonarRadarBg';
import AnimatedCascadePreview from '@/components/AnimatedCascadePreview';
import Logo from '@/components/Logo';
import type { Chain } from '@/lib/types';

// MiniRadarPreview removed from hero (duplicate of AnimatedCascadePreview below)
import AgentCascadeDiagram from '@/components/AgentCascadeDiagram';
import CostComparisonWidget from '@/components/CostComparisonWidget';
import AnimatedStat from '@/components/AnimatedStat';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};



function DistCard({
  tag,
  title,
  desc,
  example,
}: {
  tag: string;
  title: string;
  desc: string;
  example: React.ReactNode;
}) {
  return (
    <div className="bg-surface p-6 border border-border flex flex-col justify-between gap-6 w-full min-h-[380px] shadow-lg shadow-black/40 transition-all duration-300 select-none hover:-translate-y-1.5 hover:bg-[#1a1813] hover:shadow-2xl hover:shadow-black/60">
      <div>
        <div className="mb-3 inline-block bg-white/[0.04] border border-border px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-zinc-400 font-bold uppercase">
          {tag}
        </div>
        <h3 className="mb-2 font-sans text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="font-sans text-xs text-zinc-400 leading-relaxed font-normal">{desc}</p>
      </div>
      
      {/* Monospace Code Preview Box at Bottom */}
      <div className="w-full bg-black/60 border border-border p-4 font-mono text-[10px] leading-relaxed text-zinc-300 border-l-2 border-l-mustard min-h-[90px] flex flex-col justify-center select-none">
        {example}
      </div>
    </div>
  );
}
interface LastScanData {
  address: string;
  chain: string;
  verdict: string;
  riskScore: number;
  time: number;
}

export default function LandingPage() {
  const [chain, setChain] = useState<Chain>('EVM');
  const [address, setAddress] = useState('');
  const [lastScan, setLastScan] = useState<LastScanData | null>(null);

  // Lazy client-side-only local storage initialization to avoid SSR/hydration warning
  useEffect(() => {
    try {
      const stored = localStorage.getItem('btl-radar-last-scan');
      if (stored) {
        setLastScan(JSON.parse(stored));
      }
    } catch {}
  }, []);


  function startScan(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    window.location.href = `/app?address=${encodeURIComponent(trimmed)}&chain=${chain}`;
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans overflow-x-clip">
      {/* NAVBAR */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-bg/85 border-b border-border px-6 md:px-12 py-4 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5 font-mono text-sm font-bold tracking-widest text-white">
          <Logo className="h-5 w-5 animate-[pulse_2s_infinite]" />
          BTL RADAR
        </Link>
        
        <ul className="hidden md:flex items-center gap-8 font-mono text-xs text-zinc-400">
          <li>
            <a href="#economics" className="transition-colors hover:text-white">
              BTL Economics
            </a>
          </li>
          <li>
            <a href="#how" className="transition-colors hover:text-white">
              Agent Cascade
            </a>
          </li>
          <li>
            <a href="#bots" className="transition-colors hover:text-white">
              Distribution Channels
            </a>
          </li>
          <li>
            <a href="#demo" className="transition-colors hover:text-white">
              Live Demo
            </a>
          </li>
        </ul>

        <div>
          <Link href="/app?demo=true" className="bg-white hover:bg-zinc-200 text-black px-5 py-2 font-mono text-xs font-bold tracking-wider transition-colors select-none">
            Launch Radar →
          </Link>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border pt-12 pb-24 md:pt-16 md:pb-32 px-6 md:px-12 flex flex-col items-center justify-center text-center">
        {/* Sonar Radar Canvas background */}
        <SonarRadarBg />

        <div className="relative z-10 max-w-[960px] mx-auto flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 border border-mustard/30 bg-mustard/5 text-mustard text-[0.65rem] uppercase font-mono tracking-widest px-3.5 py-1.5 inline-flex items-center gap-2 select-none"
          >
            <span className="h-1.5 w-1.5 bg-mustard animate-ping" />
            Powered by BTL Runtime · Multi-Chain Security
          </motion.div>

          {/* Demo mode hint */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-4 inline-flex items-center gap-2 border border-zinc-700 bg-white/[0.03] px-3 py-1 font-mono text-[0.6rem] text-zinc-400 tracking-widest select-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
            LIVE DEMO AVAILABLE — click <span className="text-white font-bold mx-1">Launch Radar</span> to watch the full AI cascade run instantly
          </motion.div>

          <h1 className="mb-6 font-sans text-[clamp(2.5rem,6vw,4.8rem)] font-extrabold leading-[1.05] tracking-tight flex flex-wrap justify-center gap-x-[0.3em]">
            {[
              { text: 'Three', isMustard: false },
              { text: 'agents.', isMustard: false },
              { text: 'One', isMustard: false },
              { text: 'gateway.', isMustard: false },
              { text: 'Zero', isMustard: true },
              { text: 'rugs.', isMustard: true }
            ].map((w, idx) => (
              <span
                key={idx}
                className={`animate-word ${w.isMustard ? 'text-mustard font-black' : 'text-white'}`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {w.text}
              </span>
            ))}
          </h1>

          {/* RetainDB Memory Callout — replaces duplicate live feed */}
          <div className="mt-8 w-full max-w-[800px] border border-border bg-black/40 backdrop-blur-sm font-mono text-xs select-none">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-[10px] uppercase text-zinc-500 font-bold">
              <span>🧠 Persistent Scan Memory · via RetainDB</span>
              <span className="text-green flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-green rounded-full animate-pulse" />
                MEMORY ACTIVE
              </span>
            </div>
            {lastScan ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="px-4 py-3 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Scanned Contract</span>
                  <span className="text-zinc-300 truncate">{lastScan.address.slice(0, 10)}...{lastScan.address.slice(-4)} · {lastScan.chain}</span>
                  <span className="text-zinc-500 text-[9px]">{new Date(lastScan.time).toLocaleTimeString()}</span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Verdict</span>
                  <span className={`font-bold ${lastScan.verdict === 'TRAP' ? 'text-red' : lastScan.verdict === 'RISKY' ? 'text-yellow' : 'text-green'}`}>{lastScan.verdict}</span>
                  <span className="text-zinc-500 text-[9px]">Risk Score: {lastScan.riskScore}%</span>
                </div>
                <div className="px-4 py-3 flex flex-col justify-center">
                  <Link href={`/app?address=${lastScan.address}&chain=${lastScan.chain}`} className="border border-zinc-700 bg-white/5 hover:bg-white/10 px-3 py-2 text-zinc-300 hover:text-white text-[10px] font-bold text-center transition-colors">
                    Re-scan Contract →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="px-4 py-3 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Last Scan</span>
                  <span className="text-zinc-300">3bBQrzzq9DRX...pump · SOL</span>
                  <span className="text-zinc-500 text-[9px]">Risk: 12% · 2h ago</span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Current Scan</span>
                  <span className="text-zinc-300">3bBQrzzq9DRX...pump · SOL</span>
                  <span className="text-zinc-500 text-[9px]">Risk: 91% · now</span>
                </div>
                <div className="px-4 py-3 flex flex-col justify-center">
                  <div className="border border-yellow/40 bg-yellow/5 px-3 py-2 text-yellow text-[10px] font-bold text-center">
                    ⚠️ Risk increased from 12% → 91% since last scan
                  </div>
                </div>
              </div>
            )}
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 max-w-[660px] font-sans text-lg md:text-xl text-zinc-200 font-normal leading-relaxed"
          >
            Scan EVM or Solana tokens continuously. Three coordinated agents, dynamically routed by BTL Runtime, screen every transaction and flag bad actors before your capital is compromised.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
          >
            <Link href="/app?demo=true" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black px-8 py-3.5 font-mono text-sm font-bold tracking-wider transition-colors text-center select-none">
              Launch Radar Dashboard
            </Link>
            <a
              href="https://t.me/BTLRadarBot"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-zinc-700 hover:border-white bg-surface hover:bg-white/[0.02] text-zinc-300 hover:text-white px-8 py-3.5 font-mono text-sm font-semibold tracking-wider transition-colors text-center select-none"
            >
              → Try on Telegram
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 w-full grid grid-cols-2 md:grid-cols-4 border-t border-y border-border divide-x divide-border bg-black/30 backdrop-blur-sm"
          >
            <AnimatedStat targetValue={3} label="Cascading AI Agents" />
            <AnimatedStat targetValue={2} suffix=" chains" label="Supported Chains" />
            <AnimatedStat targetValue={99} prefix="~" suffix="%" label="BTL Cost Reduction" />
            <AnimatedStat targetValue={10} prefix="<" suffix="s" label="Verdict Speed" />
          </motion.div>
        </div>
      </section>

      {/* ECONOMIC VIABILITY SECTION */}
      <section id="economics" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto border-b border-border">
        <motion.div {...fadeInUp} className="mb-16">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Economic Viability Study</p>
          <h2 className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
            How BTL Makes Transaction Screening Commercially Viable
          </h2>
          <p className="mt-4 text-zinc-300 text-base md:text-lg max-w-[720px] font-normal leading-relaxed">
            Running LLM-based continuous transaction scanning is financially impossible on raw model endpoints. BTL Runtime&apos;s multi-provider routing solves this by matching processing requirements to the cheapest capable model.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Without BTL */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-red/20 bg-red/5 p-8 flex flex-col justify-between"
          >
            <div>
              <div className="inline-block bg-red/10 border border-red/20 text-red font-mono text-[0.65rem] tracking-widest px-2.5 py-1 mb-6 font-bold">
                WITHOUT BTL (RAW GPT-4O RUNS)
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-4">Prohibitive API Inflation</h3>
              <p className="font-sans text-base text-zinc-300 leading-relaxed font-normal">
                Running a highly advanced reasoning model (like GPT-4o or Claude 3.5 Sonnet) on every transaction block is prohibitively expensive. At 1,000 transactions per day, this model inflates operational overhead past hundreds of dollars.
              </p>
              
              <ul className="mt-6 space-y-3 font-mono text-sm text-zinc-400">
                <li className="flex items-center gap-2 text-red/80">
                  <span>❌</span> Cost per 1,000 runs: ~$150.00
                </li>
                <li className="flex items-center gap-2">
                  <span>❌</span> Over-provisioning: 99% of normal txs run on tier-1 reasoning
                </li>
                <li className="flex items-center gap-2">
                  <span>❌</span> No fallback: API downtime equals complete system outage
                </li>
              </ul>
            </div>
            <div className="mt-8 border-t border-red/10 pt-4 font-mono text-sm text-red font-semibold">
              Result: Project economically unfeasible.
            </div>
          </motion.div>

          {/* With BTL */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-mustard/20 bg-mustard/5 p-8 flex flex-col justify-between"
          >
            <div>
              <div className="inline-block bg-mustard/10 border border-mustard/20 text-mustard font-mono text-[0.65rem] tracking-widest px-2.5 py-1 mb-6 font-bold">
                WITH BTL RUNTIME (CASCADING)
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-4">Dynamic Model Tiering</h3>
              <p className="font-sans text-base text-zinc-300 leading-relaxed font-normal">
                BTL filters out noise cheaply. Under normal conditions, Agent 1 (Screener) processes transactions at near-zero cost using `deepseek-v4-flash` on BTL&apos;s direct DeepSeek route. Heavier reasoning models only boot up when anomalies are confirmed.
              </p>

              <ul className="mt-6 space-y-3 font-mono text-sm text-green/80">
                <li className="flex items-center gap-2 text-green/80">
                  <span>✓</span> Cost per 1,000 runs: ~$1.10 (99.2% saved)
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Efficiency: Only suspicious logs escalate to deep-reasoning models
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Dynamic: Cost headers retrieved instantly via BTL response metadata
                </li>
              </ul>
            </div>
            <div className="mt-8 border-t border-mustard/10 pt-4 font-mono text-sm text-mustard font-semibold">
              Result: Fully viable production-ready model.
            </div>
          </motion.div>
        </div>

        {/* Cost Savings Widget Detail */}
        <motion.div {...fadeInUp} className="border border-border bg-surface p-6 font-mono text-sm text-zinc-400">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4 mb-4">
            <span className="text-white font-bold tracking-wider">BTL HEADER INTEGRATION EXAMPLE:</span>
            <span className="text-zinc-500 font-mono">src/lib/btl.ts</span>
          </div>
          <p className="mb-3 leading-relaxed text-zinc-300 text-base">
            The BTL gateway appends exact billing figures to every response. Our dashboard intercepts these headers to track cost savings on every transaction scan:
          </p>
          <pre className="p-4 bg-black/60 text-zinc-300 font-mono text-xs overflow-x-auto border border-border">
{`benchmarkCost = parseFloat(response.headers.get('x-btl-benchmark-cost') || '0');
customerCharge = parseFloat(response.headers.get('x-btl-customer-charge') || '0');
saved = parseFloat(response.headers.get('x-btl-saved') || '0');`}
          </pre>
        </motion.div>
      </section>

      {/* LIVE DEMO SCANNER SECTION */}
      <section id="demo" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto border-b border-border">
        <motion.div {...fadeInUp} className="mb-12">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Interactive Sandbox</p>
          <h2 className="font-sans text-3xl font-bold text-white tracking-tight">Test BTL Radar</h2>
          <p className="mt-2 text-zinc-300 text-base font-normal leading-relaxed">
            Select a blockchain networks, paste a token contract address, and launch scanning dashboard.
          </p>
        </motion.div>

        {/* Direct Address Input Form */}
        <motion.form 
          {...fadeInUp}
          onSubmit={startScan} 
          className="mb-12 flex flex-col md:flex-row items-stretch gap-3 border border-border bg-surface p-4"
        >
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Paste contract address (E.g. SOL Token CA, EVM Address...)"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm text-text placeholder:text-zinc-600 focus:outline-none border-b md:border-b-0 md:border-r border-border"
          />
          <div className="flex gap-1 py-2 md:py-0 px-2 justify-center">
            {(['EVM', 'SOL'] as Chain[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChain(c)}
                className={`border px-4 py-1.5 font-mono text-xs tracking-wider transition-colors select-none ${
                  chain === c ? 'border-white bg-white text-black font-bold' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button type="submit" className="whitespace-nowrap bg-white hover:bg-zinc-200 text-black px-6 py-3 font-mono text-xs font-bold tracking-widest transition-colors select-none">
            SCAN ADDRESS →
          </button>
        </motion.form>

        {/* INTERACTIVE CASCADING COLUMN PREVIEW LOOP ANIMATION */}
        <motion.div {...fadeInUp}>
          <AnimatedCascadePreview />
        </motion.div>
      </section>

      {/* DETAILED CASCADE EXPLANATION (STAGGERED WAVE CARD LAYOUT) */}
      <section id="how" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto border-b border-border">
        <motion.div {...fadeInUp} className="mb-16">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Cascade Architecture</p>
          <h2 className="font-sans text-3xl font-bold text-white tracking-tight">The Three-Agent Pipeline</h2>
          <p className="mt-2 text-zinc-300 text-base font-normal leading-relaxed">
            By segmenting inspection roles, BTL Radar optimizes security detection without inflating costs.
          </p>
        </motion.div>

        <AgentCascadeDiagram />
      </section>

      {/* RETAINDB CROSS-SCAN MEMORY SECTION */}
      <section className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto border-b border-border">
        <motion.div {...fadeInUp} className="mb-12">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">Persistent Memory Layer</p>
          <h2 className="font-sans text-3xl font-bold text-white tracking-tight">BTL Radar Remembers</h2>
          <p className="mt-2 text-zinc-300 text-base font-normal leading-relaxed max-w-[640px]">
            Every scan is stored in <span className="text-white font-semibold">RetainDB</span> — BTL&apos;s native memory infrastructure. When you re-scan a token, the system automatically surfaces risk trend deltas, letting you see if a contract that looked safe yesterday is now showing signs of a rug.
          </p>
        </motion.div>

        <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
          {/* Step 1 */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-border flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Step 01</div>
            <div className="text-3xl font-black text-white">Scan</div>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
              Submit a token contract. All three agents run and the verdict — including risk score and forensic findings — is written to RetainDB under the contract address key.
            </p>
            <div className="mt-auto font-mono text-[9px] text-zinc-600 uppercase border-t border-border pt-3">
              Stored: risk_score, flags, verdict, timestamp
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-border flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Step 02</div>
            <div className="text-3xl font-black text-white">Return</div>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
              Scan the same contract again later. The backend queries RetainDB for historical records before running agents — injecting previous risk scores directly into the screener&apos;s context.
            </p>
            <div className="mt-auto font-mono text-[9px] text-zinc-600 uppercase border-t border-border pt-3">
              Memory: last 5 scans · sorted descending
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Step 03</div>
            <div className="text-3xl font-black text-mustard">Alert</div>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans">
              If risk has increased, a delta banner surfaces automatically — before agents even complete. Historical context is also injected into the screener&apos;s prompt for sharper accuracy.
            </p>
            <div className="mt-auto border border-yellow/40 bg-yellow/5 px-3 py-2 font-mono text-[10px] text-yellow font-bold">
              ⚠️ Risk increased from 12% → 91% since last scan
            </div>
          </div>
        </motion.div>
      </section>

      <CostComparisonWidget />

      {/* ACCESS RADAR EVERYWHERE: RESPONSIVE GRID SECTION */}
      <section id="bots" className="py-24 px-6 md:px-12 bg-bg border-b border-border">
        <div className="max-w-[1100px] mx-auto w-full mb-12">
          <motion.p {...fadeInUp} className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500 font-bold">
            Integrations & surfaces
          </motion.p>
          <motion.h2 {...fadeInUp} className="font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
            Access Radar Everywhere
          </motion.h2>
          <motion.p {...fadeInUp} className="mt-4 text-zinc-300 text-base md:text-lg max-w-[720px] font-normal leading-relaxed">
            Use the Radar dashboard directly in the browser, or call our automated client bots on Telegram and X.
          </motion.p>
        </div>

        {/* 3-Column Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
          <DistCard
            tag="WEB APP"
            title="Radar Dashboard"
            desc="Interactive dashboard displaying real-time transactions, live console output streams, historical scan comparisons, and visual BTL cost trackers."
            example={
              <>
                → btl-radar.vercel.app
                <br />→ Supports Solana (SPL)
                <br />→ Supports EVM Networks
              </>
            }
          />
          
          <DistCard
            tag="TELEGRAM BOT"
            title="@BTLRadarBot"
            desc="Add our automated analysis bot to your trading channels. Instantly scans contract addresses sent in messages and replies with simple alert logs."
            example={
              <>
                User: @BTLRadarBot 0x4f2a...
                <br />
                Bot: ⚠️ CRITICAL WARNING · 91% risk
                <br />
                Dev drained 34% liquidity pool.
              </>
            }
          />

          <DistCard
            tag="X BOT"
            title="@BTLRadar"
            desc="Mention our official handle with a token contract address. Our daemon scans the contract and replies with quote tweets inside of seconds."
            example={
              <>
                User: @BTLRadar check this token CA
                <br />
                Bot: Quote-Tweet: SAFE (4% risk)
                <br />
                btl-radar.vercel.app/app
              </>
            }
          />
        </div>
      </section>

      {/* PRE-FOOTER CTA */}
      <section className="bg-surface border-t border-border px-6 md:px-12 py-24 text-center">
        <motion.div {...fadeInUp}>
          <h2 className="mb-4 font-sans text-3xl md:text-4xl font-bold text-white tracking-tight">
            Know Before You Ape.
          </h2>
          <p className="mb-8 max-w-[480px] mx-auto text-zinc-300 text-base font-normal leading-relaxed">
            Zero wallet connections needed. Scan any EVM or Solana token contract now and bypass bad liquidity pools.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link href="/app?demo=true" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black px-8 py-3.5 font-mono text-xs font-bold tracking-widest transition-colors select-none">
              LAUNCH RADAR NOW
            </Link>
            <a
              href="https://t.me/BTLRadarBot"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-600 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white px-8 py-3.5 font-mono text-xs font-bold tracking-widest transition-colors select-none"
            >
              TELEGRAM CHANNEL
            </a>
          </div>
        </motion.div>
      </section>

      {/* COMPREHENSIVE FOOTER */}
      <footer className="border-t border-border bg-black/65 px-6 md:px-12 py-16 font-mono text-xs text-zinc-500">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Col 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-widest">
              <Logo className="h-5 w-5 animate-[pulse_2s_infinite]" />
              BTL RADAR
            </div>
            <p className="text-zinc-500 font-light leading-relaxed font-sans text-xs">
              Real-time token security intelligence powered by BTL Runtime. Continuous inspection engine preventing retail capital rugs.
            </p>
            <div className="mt-2 text-[0.65rem] text-zinc-600">
              © 2026 BTL Radar. Released under MIT.
            </div>
          </motion.div>

          {/* Col 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[0.7rem]">Architecture</span>
            <ul className="space-y-2 text-zinc-600">
              <li>Agent 1: High-Speed Screener</li>
              <li>Agent 2: Forensic Analyst</li>
              <li>Agent 3: Tactical Judge</li>
              <li>BTL /v1/chat/completions</li>
            </ul>
          </motion.div>

          {/* Col 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[0.7rem]">Integrations</span>
            <ul className="space-y-2 text-zinc-600">
              <li><Link href="/app" className="hover:text-zinc-400 transition-colors">Web App Dashboard</Link></li>
              <li><a href="https://t.me/BTLRadarBot" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">Telegram Alert Bot</a></li>
              <li><a href="https://x.com/BTLRadar" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">X Mentions Daemon</a></li>
              <li>WebSocket Streamers</li>
            </ul>
          </motion.div>

          {/* Col 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[0.7rem]">Developer Links</span>
            <ul className="space-y-2 text-zinc-600">
              <li><a href="https://runtime.badtheorylabs.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">BTL Runtime API Docs</a></li>
              <li><a href="https://api.badtheorylabs.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">BTL API Gateway</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-400 transition-colors">Github Repository</a></li>
              <li><a href="mailto:hello@badtheorylabs.com" className="hover:text-zinc-400 transition-colors">Contact Support</a></li>
            </ul>
          </motion.div>
        </div>

        <div className="max-w-[1100px] mx-auto pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[0.65rem] text-zinc-600">
            For the Bad Theory Labs Runtime
          </div>
          <div className="flex gap-6 text-[0.7rem]">
            <a href="https://runtime.badtheorylabs.com" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">BTL Runtime</a>
            <a href="https://t.me/BTLRadarBot" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">Telegram</a>
            <a href="https://x.com/BTLRadar" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">X / Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
