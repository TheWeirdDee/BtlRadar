'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ContractInput from '@/components/ContractInput';
import MemoryBanner from '@/components/MemoryBanner';
import RadarColumns from '@/components/RadarColumns';
import CostWidget from '@/components/CostWidget';
import type { Chain, Transaction } from '@/lib/types';

type Verdict = 'SAFE' | 'RISKY' | 'TRAP';

interface ScanResponse {
  verdict: Verdict;
  risk_score: number;
  flags: string[];
  summary: string;
  action: string;
  key_evidence: string[];
  suspicious_hashes?: string[];
  benchmark_cost: number;
  actual_cost: number;
  saved: number;
  escalated_to_agent2: boolean;
  escalated_to_agent3: boolean;
  memory: string | null;
}

interface Target {
  address: string;
  chain: Chain;
}

const EMPTY_COSTS = { benchmark: 0, actual: 0, saved: 0, requests: 0 };

// The $BTL token itself — used to pre-fill the demo so judges see it loaded
// without having to find a contract address themselves.
const DEMO_ADDRESS = '3bBQrzzq9DRXXFfC9nUno9m1MBm9Y7dVnBBK44bVpump';
const DEMO_CHAIN: Chain = 'SOL';


export default function RadarDashboard() {
  const searchParams = useSearchParams();
  const demo = searchParams.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Lets the landing page hand off directly into a running scan via
  // /app?address=...&chain=..., instead of requiring the address to be
  // retyped once the user lands here. Read once, as lazy initial state,
  // rather than in an effect that would call setState on mount.
  const [target, setTarget] = useState<Target | null>(() => {
    const address = searchParams.get('address');
    if (address) {
      const chain: Chain = searchParams.get('chain')?.toUpperCase() === 'SOL' ? 'SOL' : 'EVM';
      return { address, chain };
    }
    // If demo query parameter is true, automatically load the demo coin address to kick off scanning cascade immediately
    const demoMode = searchParams.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (demoMode) {
      return { address: DEMO_ADDRESS, chain: DEMO_CHAIN };
    }
    return null;
  });
  const [statusByHash, setStatusByHash] = useState<Record<string, 'CLEAN' | 'FLAGGED'>>({});
  const [memoryContext, setMemoryContext] = useState<string | null>(null);

  const [forensicActive, setForensicActive] = useState(false);
  const [forensicFindings, setForensicFindings] = useState<string[]>([]);
  const [forensicAnalyzing, setForensicAnalyzing] = useState(false);

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  const [summary, setSummary] = useState('');
  const [action, setAction] = useState('');
  const [keyEvidence, setKeyEvidence] = useState<string[]>([]);

  const [costs, setCosts] = useState(EMPTY_COSTS);

  const handleScan = useCallback(
    (address: string, chain: Chain) => {
      setTarget({ address, chain });
      setStatusByHash({});
      setForensicActive(false);
      setForensicFindings([]);
      setVerdict(null);
      setCosts(EMPTY_COSTS);

      // Demo mode never touches Supabase/RetainDB live, so the "risk increased since last
      // scan" banner is dynamically computed from sessionStorage instead:
      if (demo) {
        const prevScanStr = sessionStorage.getItem(`demo-scan-result-${address.toLowerCase()}`);
        if (prevScanStr) {
          try {
            const prevScan = JSON.parse(prevScanStr);
            // In mock/demo mode, $BTL address is TRAP at 91%, other addresses are SAFE at 4%
            const nextRisk = address.toLowerCase() === DEMO_ADDRESS.toLowerCase() ? 91 : 4;
            const delta = nextRisk - prevScan.risk_score;
            if (delta > 10) {
              setMemoryContext(`[DEMO] ⚠️ Risk increased by ${delta}% since last scan. Previously: ${prevScan.verdict} at ${prevScan.risk_score}%.`);
            } else if (delta < -10) {
              setMemoryContext(`[DEMO] ✅ Risk decreased by ${Math.abs(delta)}% since last scan. Previously: ${prevScan.verdict} at ${prevScan.risk_score}%.`);
            } else {
              setMemoryContext(`[DEMO] Previously scanned. Verdict: ${prevScan.verdict} at ${prevScan.risk_score}% risk.`);
            }
          } catch {
            setMemoryContext(null);
          }
        } else {
          setMemoryContext(null);
        }
      } else {
        setMemoryContext(null);
      }
    },
    [demo]
  );

  // ── Batched transaction scanning ──────────────────────────────────────
  // Instead of firing one BTL request per transaction (which causes 100+ calls/min
  // from the Alchemy/Helius firehose), we buffer incoming txs and flush as one batch
  // every BATCH_INTERVAL_MS OR when MAX_BATCH_SIZE is reached (for high-volume tokens
  // like USDC where 5s of silence never comes).
  const BATCH_INTERVAL_MS = 5000;
  const MAX_BATCH_SIZE = 20;   // flush immediately at this many txs
  const MAX_FEED_TXS = 50;     // stop scanning after this many txs total (auto-pauses feed)
  const txBufferRef = useRef<Transaction[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(() => {
    if (!target || txBufferRef.current.length === 0) return;
    const batch = txBufferRef.current.splice(0);
    setForensicAnalyzing(true);

    fetch(demo ? '/api/scan/mock' : '/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: target.address,
        chain: target.chain,
        transactions: batch,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
        return res.json() as Promise<ScanResponse>;
      })
      .then((data) => {
        // Mark only the suspicious hashes as FLAGGED, and the rest as CLEAN
        const flaggedHashes = data.suspicious_hashes || [];
        setStatusByHash((prev) => {
          const updates: Record<string, 'CLEAN' | 'FLAGGED'> = {};
          batch.forEach((tx) => {
            updates[tx.hash] = flaggedHashes.includes(tx.hash) ? 'FLAGGED' : 'CLEAN';
          });
          return { ...prev, ...updates };
        });

        // Save demo scan to sessionStorage so the next scan can calculate a live delta
        if (demo) {
          sessionStorage.setItem(`demo-scan-result-${target.address.toLowerCase()}`, JSON.stringify({
            verdict: data.verdict,
            risk_score: data.risk_score,
          }));
        }

        setMemoryContext((prev) => prev ?? data.memory);

        setCosts((prev) => ({
          benchmark: prev.benchmark + data.benchmark_cost,
          actual: prev.actual + data.actual_cost,
          saved: prev.saved + data.saved,
          requests:
            prev.requests +
            1 +
            (data.escalated_to_agent2 ? 1 : 0) +
            (data.escalated_to_agent3 ? 1 : 0),
        }));

        const SEVERITY = { SAFE: 0, RISKY: 1, TRAP: 2 };
        const currentSeverity = verdict ? SEVERITY[verdict] : -1;
        const newSeverity = SEVERITY[data.verdict];

        if (data.escalated_to_agent2) {
          setForensicActive(true);
          setForensicFindings(data.flags);
        }

        if (newSeverity >= currentSeverity) {
          setVerdict(data.verdict);
          setRiskScore(data.risk_score);
          setSummary(data.summary);
          setAction(data.action);
          setKeyEvidence(data.key_evidence);
        }

        // Save scan details to localStorage for landing page personalization
        try {
          const lastScanData = {
            address: target.address,
            chain: target.chain,
            verdict: data.verdict,
            riskScore: data.risk_score,
            time: Date.now(),
          };
          localStorage.setItem('btl-radar-last-scan', JSON.stringify(lastScanData));
        } catch {}
      })
      .catch((error) => {
        console.error('Scan batch failed:', error);
        const updates: Record<string, 'CLEAN' | 'FLAGGED'> = {};
        batch.forEach((tx) => { updates[tx.hash] = 'CLEAN'; });
        setStatusByHash((prev) => ({ ...prev, ...updates }));
      })
      .finally(() => setForensicAnalyzing(false));
  }, [target, demo, verdict]);

  // Clear batch timer when target changes
  useEffect(() => {
    txBufferRef.current = [];
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
  }, [target]);

  const handleTransaction = useCallback(
    (tx: Transaction) => {
      if (!target) return;

      txBufferRef.current.push(tx);

      // Flush immediately if batch is full, otherwise debounce
      if (txBufferRef.current.length >= MAX_BATCH_SIZE) {
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
        flushBatch();
      } else {
        // Debounce: reset the timer on each new tx, flush after BATCH_INTERVAL_MS of silence
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(flushBatch, BATCH_INTERVAL_MS);
      }
    },
    [target, flushBatch]
  );

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-bg">
      {/* ── Back to landing nav bar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg/90 backdrop-blur-sm px-4 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors select-none group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>BTL Radar</span>
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 flex items-center gap-2">
          <span>Radar Dashboard</span>
          {demo ? (
            <>
              <span className="text-mustard font-bold">· Demo Mode</span>
              <Link href="/app" className="ml-2 px-1.5 py-0.5 border border-zinc-700 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold text-[9px] normal-case">
                Go Live
              </Link>
            </>
          ) : (
            <Link href="/app?demo=true" className="ml-2 px-1.5 py-0.5 border border-zinc-700 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold text-[9px] normal-case">
              Try Demo Mode
            </Link>
          )}
        </div>
        <a
          href="https://t.me/BTLRadarBot"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block"
        >
          Telegram Bot →
        </a>
      </nav>

      <div className="flex flex-col gap-4 p-6">
      <ContractInput
        onScan={handleScan}
        initialAddress={target?.address ?? (demo ? DEMO_ADDRESS : undefined)}
        initialChain={target?.chain ?? (demo ? DEMO_CHAIN : undefined)}
      />

      {target && (
        <>
          <MemoryBanner memoryContext={memoryContext} />

          <RadarColumns
            address={target.address}
            chain={target.chain}
            demo={demo}
            onTransaction={handleTransaction}
            statusByHash={statusByHash}
            forensicActive={forensicActive}
            forensicFindings={forensicFindings}
            forensicAnalyzing={forensicAnalyzing}
            verdict={verdict}
            riskScore={riskScore}
            summary={summary}
            action={action}
            keyEvidence={keyEvidence}
            maxTxs={MAX_FEED_TXS}
          />

          <CostWidget benchmarkCost={costs.benchmark} actualCost={costs.actual} saved={costs.saved} requests={costs.requests} />
        </>
      )}
      </div>
    </main>
  );
}
