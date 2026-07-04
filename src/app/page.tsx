'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import SonarRadarBg from '@/components/SonarRadarBg';
import AnimatedCascadePreview from '@/components/AnimatedCascadePreview';
import Logo from '@/components/Logo';
import type { Chain } from '@/lib/types';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-border p-6 last:border-r-0 flex flex-col justify-center min-h-[110px] hover:bg-white/[0.01] transition-colors">
      <span className="block font-mono text-4xl font-black text-white mb-1.5">{value}</span>
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold">{label}</span>
    </div>
  );
}

function AgentCard({
  num,
  name,
  model,
  desc,
  trigger,
}: {
  num: string;
  name: string;
  model: string;
  desc: string;
  trigger: string;
}) {
  return (
    <div className="bg-surface p-8 border border-border flex flex-col justify-between transition-all duration-300 min-h-[380px] shadow-lg shadow-black/40 hover:-translate-y-1.5 hover:bg-[#1a1813] hover:shadow-2xl hover:shadow-black/60">
      <div>
        <div className="mb-4 font-mono text-xs tracking-widest text-zinc-400 font-bold">{num}</div>
        <div className="mb-3 font-sans text-xl font-bold text-white">{name}</div>
        <div className="mb-6 inline-block bg-white/[0.04] border border-border px-2.5 py-1 font-mono text-xs text-zinc-300">
          {model}
        </div>
        <p className="font-sans text-base text-zinc-200 leading-relaxed font-normal">{desc}</p>
      </div>
      <div className="mt-8 border-t border-border pt-4 font-mono text-xs text-zinc-400 tracking-wide">
        {trigger}
      </div>
    </div>
  );
}

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
    <div className="bg-surface p-8 border border-border flex flex-col md:flex-row items-stretch gap-8 w-[85vw] md:w-[780px] min-h-[260px] shadow-lg shadow-black/40 transition-all duration-300 select-none shrink-0 hover:-translate-y-1.5 hover:bg-[#1a1813] hover:shadow-2xl hover:shadow-black/60">
      {/* Left side: Monospace Example Box */}
      <div className="w-full md:w-[260px] shrink-0 bg-black/60 border border-border p-5 font-mono text-xs leading-relaxed text-zinc-300 border-l-2 border-l-mustard flex flex-col justify-center select-none">
        {example}
      </div>
      
      {/* Right side: Core card description */}
      <div className="flex-1 flex flex-col justify-center">
        <div>
          <div className="mb-3 inline-block bg-white/[0.04] border border-border px-2.5 py-0.5 font-mono text-xs tracking-widest text-zinc-400 font-bold">
            {tag}
          </div>
          <h3 className="mb-3 font-sans text-xl font-bold text-white">{title}</h3>
          <p className="font-sans text-base text-zinc-300 leading-relaxed font-normal">{desc}</p>
        </div>
      </div>
    </div>
  );
}
export default function LandingPage() {
  const [chain, setChain] = useState<Chain>('EVM');
  const [address, setAddress] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Horizontal Scroll Setup via Framer Motion Pinning
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxScroll, setMaxScroll] = useState(0);

  useEffect(() => {
    const calculateScroll = () => {
      if (trackRef.current) {
        const trackWidth = trackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        const paddingOffset = window.innerWidth >= 768 ? 48 : 24;
        setMaxScroll(Math.max(0, trackWidth - viewportWidth + paddingOffset * 2));
      }
    };
    calculateScroll();
    window.addEventListener('resize', calculateScroll);
    const timer = setTimeout(calculateScroll, 1000);
    return () => {
      window.removeEventListener('resize', calculateScroll);
      clearTimeout(timer);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: scrollContainerRef });
  // Shift the horizontal track dynamically by pixel difference, guaranteeing no blank space
  const x = useTransform(scrollYProgress, [0.08, 0.82], [0, -maxScroll]);
  const xTranslate = isDesktop ? x : 0;

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
          <Link href="/app" className="bg-white hover:bg-zinc-200 text-black px-5 py-2 font-mono text-xs font-bold tracking-wider transition-colors select-none">
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

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-sans text-[clamp(2.5rem,6vw,4.8rem)] font-extrabold leading-[1.05] tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          >
            Three cascading agents.<br />
            One AI gateway.<br />
            <span className="text-mustard font-black">Zero rug pulls.</span>
          </motion.h1>

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
            <Link href="/app" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black px-8 py-3.5 font-mono text-sm font-bold tracking-wider transition-colors text-center select-none">
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
            <StatCard value="3" label="Cascading AI Agents" />
            <StatCard value="EVM + SOL" label="Multi-Chain Coverage" />
            <StatCard value="99.2%" label="BTL Cost Reduction" />
            <StatCard value="&lt;10s" label="Analysis Speed" />
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

        {/* Staggered Vertical Card Arrangement matching User Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pb-16 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AgentCard
              num="AGENT 01"
              name="Real-Time Screener"
              model="deepseek-v4-flash via BTL"
              desc="Watches all incoming block transactions. Screens for simple heuristics: transfer size, volume shifts, dev interactions. Cost is extremely low, allowing continuous execution at scale."
              trigger="Inputs: Raw blocks · Output: Suspicious flag"
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 78 }}
            whileInView={{ opacity: 1, y: 48 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AgentCard
              num="AGENT 02"
              name="Forensic Analyst"
              model="deepseek-v4-pro via BTL"
              desc="Runs only on flagged flags. Analyzes wallet graphs, historical interactions, wallet age, deployer address profiles, and liquidity locking certificates."
              trigger="Trigger: Agent 1 flag · Output: Escalation matrix"
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AgentCard
              num="AGENT 03"
              name="Tactical Judge"
              model="deepseek-v4-pro · deep reasoning via BTL"
              desc="Fires only on verified threats. Takes the entire compiled forensics report, generates a plain-English risk profile, assigns a probability score, and updates external API hooks."
              trigger="Trigger: High risk threat · Output: Verdict alert"
            />
          </motion.div>
        </div>
      </section>

      {/* ACCESS RADAR EVERYWHERE: PIN & HORIZONTAL SCROLL SECTION */}
      <section id="bots" ref={scrollContainerRef} className="relative h-auto md:h-[180vh] bg-bg border-b border-border">
        {/* Sticky viewport frame */}
        <div className="relative md:sticky md:top-0 md:h-screen flex flex-col justify-center py-16 md:py-0 overflow-visible md:overflow-hidden">
          
          <div className="max-w-[1100px] mx-auto w-full px-6 md:px-12 mb-12">
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

          {/* Horizontal animated track container */}
          <div className="relative w-full overflow-x-auto md:overflow-hidden scrollbar-none snap-x snap-mandatory">
            <motion.div 
              ref={trackRef}
              style={{ x: xTranslate }} 
              className="flex gap-8 pl-6 md:pl-12 pr-6 md:pr-12 w-max snap-center shrink-0"
            >
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
            </motion.div>
          </div>

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
            <Link href="/app" className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black px-8 py-3.5 font-mono text-xs font-bold tracking-widest transition-colors select-none">
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
