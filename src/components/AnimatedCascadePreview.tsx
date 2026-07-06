'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock transaction data to animate in
const TX_FLOW = [
  { hash: '5KtP3f9WxRj2hN8m...', amount: '420 $BTL', status: 'CLEAN' as const },
  { hash: '3vQnR8sTkP1mXzHc...', amount: '1,204 $BTL', status: 'CLEAN' as const },
  { hash: '9mZrK4pXcQ2jNwTb...', amount: '88 $BTL', status: 'CLEAN' as const },
  { hash: '7cWxT5nQjR3vKmYb...', amount: '3,650 $BTL', status: 'CLEAN' as const },
  { hash: '1pLmVz8cWxT4nQjR...', amount: '184,200 $BTL', status: 'FLAGGED' as const },
];

const FORENSIC_LINES = [
  '→ Flagged tx: 1pLmVz8cWxT4nQjR...',
  '→ Wallet age: 3 days',
  '→ Deployer wallet match: YES',
  '→ Liquidity pool delta: -34%',
  '→ Known pattern matches: 4 prior scams',
  '→ Dev wallet supply movement: 41%',
  '→ Escalating threat evaluation...',
];

const RISK_KEYWORDS = ['wallet_risk', 'deployer', 'liquidity', 'prior scams', 'Escolating', 'escalating'];

export default function AnimatedCascadePreview() {
  const [txs, setTxs] = useState<{ hash: string; amount: string; status: 'CLEAN' | 'SCANNING' | 'FLAGGED' }[]>([]);
  const [forensicLines, setForensicLines] = useState<string[]>([]);
  const [typingLine, setTypingLine] = useState('');
  const [typingLineIndex, setTypingLineIndex] = useState(-1);
  const [riskScore, setRiskScore] = useState(0);
  const [verdictActive, setVerdictActive] = useState(false);

  // Cost tracking
  const [benchmarkCost, setBenchmarkCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [savedPercent, setSavedPercent] = useState(0);
  const [requestsRouted, setRequestsRouted] = useState(12480);

  useEffect(() => {
    // Loop interval setup
    const timerSequence = async () => {
      // Step 0: Initial Reset state
      setTxs([]);
      setForensicLines([]);
      setTypingLine('');
      setTypingLineIndex(-1);
      setRiskScore(0);
      setVerdictActive(false);
      setBenchmarkCost(0.02);
      setActualCost(0.0001);
      setSavedPercent(99);

      // Wait 3.5s
      await new Promise((r) => setTimeout(r, 3500));

      // Step 1: Stream Clean Transactions (1 by 1)
      for (let i = 0; i < 4; i++) {
        setTxs((prev) => [...prev, { ...TX_FLOW[i] }]);
        setBenchmarkCost((b) => b + 0.02);
        setActualCost((a) => a + 0.0001);
        setRequestsRouted((r) => r + 1);
        await new Promise((r) => setTimeout(r, 3000));
      }

      // Step 2: Stream Flagged Transaction (Initially in Scanning state)
      const anomalyTx = { ...TX_FLOW[4], status: 'SCANNING' as const };
      setTxs((prev) => [...prev, anomalyTx]);
      setBenchmarkCost((b) => b + 0.02);
      setActualCost((a) => a + 0.0001);
      setRequestsRouted((r) => r + 1);
      
      await new Promise((r) => setTimeout(r, 3000));

      // Step 3: Flag Transaction (Turn Red FLAGGED)
      setTxs((prev) =>
        prev.map((t, idx) => (idx === 4 ? { ...t, status: 'FLAGGED' as const } : t))
      );
      
      await new Promise((r) => setTimeout(r, 3000));

      // Step 4: Agent 2 Forensic Analysis streams lines
      for (let lineIdx = 0; lineIdx < FORENSIC_LINES.length; lineIdx++) {
        setTypingLineIndex(lineIdx);
        const fullLine = FORENSIC_LINES[lineIdx];
        
        // Type characters
        for (let charIdx = 0; charIdx <= fullLine.length; charIdx++) {
          setTypingLine(fullLine.slice(0, charIdx));
          await new Promise((r) => setTimeout(r, 45));
        }

        // Add to completed lines list
        setForensicLines((prev) => [...prev, fullLine]);
        setTypingLine('');
        
        // Ticks up benchmark vs actual for Agent 2 processing
        setBenchmarkCost((b) => b + 0.006);
        setActualCost((a) => a + 0.0002);
        
        await new Promise((r) => setTimeout(r, 2200));
      }
      setTypingLineIndex(-1);

      await new Promise((r) => setTimeout(r, 3000));

      // Step 5: Agent 3 Judge Activates
      setVerdictActive(true);
      setBenchmarkCost((b) => b + 0.04);
      setActualCost((a) => a + 0.001);

      // Animate risk score from 0 to 91
      for (let s = 0; s <= 91; s++) {
        setRiskScore(s);
        await new Promise((r) => setTimeout(r, 45));
      }

      // Final display state
      setSavedPercent(98.4);
      
      // Wait 16 seconds before restarting loop
      await new Promise((r) => setTimeout(r, 16000));
      
      // Loop again
      timerSequence();
    };

    timerSequence();
  }, []);

  return (
    <div className="w-full">
      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-border bg-border mb-px select-none">
        
        {/* Agent 1: Screener column */}
        <div className="bg-surface p-6 font-mono flex flex-col h-[320px]">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Agent 1 · Screener</div>
              <div className="text-[0.65rem] tracking-wide text-zinc-500 mt-1">DeepSeek Chat · via BTL</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green">
              <span className="h-1.5 w-1.5 animate-pulse bg-green rounded-full" />
              LIVE FEED
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-1.5 text-[0.7rem] text-zinc-400">
            <AnimatePresence initial={false}>
              {txs.map((tx, idx) => (
                <motion.div
                  key={tx.hash + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center justify-between border-b border-border/40 py-2 ${
                    tx.status === 'CLEAN' ? 'text-green' : tx.status === 'FLAGGED' ? 'text-red' : 'text-zinc-500'
                  }`}
                >
                  <span>{tx.hash}</span>
                  <span className="opacity-80">{tx.amount}</span>
                  <span className={`border border-current px-1.5 py-0.5 text-[0.55rem] tracking-widest uppercase font-semibold`}>
                    {tx.status}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {txs.length === 0 && (
              <div className="text-zinc-600 text-xs py-4">Waiting for transactions…</div>
            )}
          </div>
        </div>

        {/* Agent 2: Forensic column */}
        <div className="bg-surface p-6 font-mono border-y md:border-y-0 border-border flex flex-col h-[320px]">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Agent 2 · Forensic</div>
              <div className="text-[0.65rem] tracking-wide text-zinc-500 mt-1">GPT-4o mini · via BTL</div>
            </div>
            {typingLineIndex >= 0 && (
              <div className="flex items-center gap-1.5 text-xs text-yellow">
                <span className="h-1.5 w-1.5 animate-pulse bg-yellow rounded-full" />
                ANALYZING
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-[0.75rem] text-zinc-400">
            {forensicLines.map((line, i) => {
              const isRisk = RISK_KEYWORDS.some((kw) => line.toLowerCase().includes(kw));
              return (
                <div key={i} className={isRisk ? 'text-yellow' : 'text-zinc-300'}>
                  {line}
                </div>
              );
            })}
            
            {typingLineIndex >= 0 && (
              <div className={RISK_KEYWORDS.some((kw) => FORENSIC_LINES[typingLineIndex].toLowerCase().includes(kw)) ? 'text-yellow font-semibold' : 'text-zinc-300'}>
                {typingLine}
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-yellow/80 animate-[pulse_1s_infinite] align-middle" />
              </div>
            )}

            {forensicLines.length === 0 && typingLineIndex < 0 && (
              <div className="text-zinc-600 text-xs py-4">Awaiting transaction escalation…</div>
            )}
          </div>
        </div>

        {/* Agent 3: Judge column */}
        <div className="bg-surface p-6 font-mono flex flex-col h-[320px]">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Agent 3 · Judge</div>
              <div className="text-[0.65rem] tracking-wide text-zinc-500 mt-1">DeepSeek R1 · via BTL</div>
            </div>
            {verdictActive && (
              <div className="flex items-center gap-1.5 text-xs text-red animate-pulse">
                <span className="h-1.5 w-1.5 bg-red rounded-full" />
                CRITICAL
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {verdictActive ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-red/20 bg-red/5 p-4"
              >
                <div className="mb-2 text-[0.65rem] uppercase tracking-widest text-red font-bold flex items-center gap-1.5">
                  <span>⚠</span> Risk Alert Verdict
                </div>
                <p className="text-[0.7rem] leading-relaxed text-zinc-300">
                  Developer supply transferred to an unverified fresh address. Pool liquidity reduced rapidly. Scanner matches historic rug-pull addresses.
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-red/10 pt-3 text-[0.65rem]">
                  <span className="tracking-widest text-zinc-500 uppercase">RUG PROBABILITY</span>
                  <span className="font-sans text-sm font-bold text-red">{riskScore}%</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-zinc-600 text-xs py-4 text-center border border-dashed border-border p-8">
                Awaiting final verdict
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COST METER COMPONENT */}
      <div className="flex w-full items-center justify-between border border-border bg-surface px-6 py-4 font-mono text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Benchmark cost</span>
          <span className="text-zinc-500 line-through">${benchmarkCost.toFixed(4)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Actual cost</span>
          <span className="text-mustard font-bold">${actualCost.toFixed(4)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Saved</span>
          <span className="font-bold text-mustard">{savedPercent > 0 ? `${savedPercent}%` : '0%'}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Requests routed</span>
          <span className="text-zinc-300">{requestsRouted.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
