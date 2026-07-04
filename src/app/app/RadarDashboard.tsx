'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const DEMO_MEMORY_SESSION_KEY = 'btl-radar-demo-scanned';
const DEMO_MEMORY_STRING = '⚠️ Risk increased from 12% to 91% since last scan';

export default function RadarDashboard() {
  const searchParams = useSearchParams();
  const demo = searchParams.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Lets the landing page hand off directly into a running scan via
  // /app?address=...&chain=..., instead of requiring the address to be
  // retyped once the user lands here. Read once, as lazy initial state,
  // rather than in an effect that would call setState on mount.
  const [target, setTarget] = useState<Target | null>(() => {
    const address = searchParams.get('address');
    if (!address) return null;
    const chain: Chain = searchParams.get('chain')?.toUpperCase() === 'SOL' ? 'SOL' : 'EVM';
    return { address, chain };
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

      // Demo mode never touches Supabase, so the "risk increased since last
      // scan" banner is simulated client-side via sessionStorage instead:
      // null on the first run this session, a canned string after that.
      if (demo) {
        const hasRunBefore = sessionStorage.getItem(DEMO_MEMORY_SESSION_KEY) === 'true';
        setMemoryContext(hasRunBefore ? DEMO_MEMORY_STRING : null);
        sessionStorage.setItem(DEMO_MEMORY_SESSION_KEY, 'true');
      } else {
        setMemoryContext(null);
      }
    },
    [demo]
  );

  // Each transaction from the feed gets its own scan call — Agent 1 is
  // designed to run on every transaction, and a single-transaction request
  // makes the flagged/clean hash unambiguous without route.ts having to
  // return hash-level detail. Demo mode posts to a fully separate mock
  // endpoint so it can never spend real BTL credentials or hit Supabase.
  const handleTransaction = useCallback(
    (tx: Transaction) => {
      if (!target) return;
      setForensicAnalyzing(true);

      fetch(demo ? '/api/scan/mock' : '/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: target.address,
          chain: target.chain,
          transactions: [tx],
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Scan request failed: ${res.status}`);
          return res.json() as Promise<ScanResponse>;
        })
        .then((data) => {
          setStatusByHash((prev) => ({
            ...prev,
            [tx.hash]: data.escalated_to_agent2 ? 'FLAGGED' : 'CLEAN',
          }));

          setMemoryContext((prev) => prev ?? data.memory);

          setCosts((prev) => ({
            benchmark: prev.benchmark + data.benchmark_cost,
            actual: prev.actual + data.actual_cost,
            saved: prev.saved + data.saved,
            // one BTL request per agent that actually fired in the cascade
            requests:
              prev.requests +
              1 +
              (data.escalated_to_agent2 ? 1 : 0) +
              (data.escalated_to_agent3 ? 1 : 0),
          }));

          if (data.escalated_to_agent2) {
            setForensicActive(true);
            setForensicFindings(data.flags);
          }

          if (data.escalated_to_agent3) {
            setVerdict(data.verdict);
            setRiskScore(data.risk_score);
            setSummary(data.summary);
            setAction(data.action);
            setKeyEvidence(data.key_evidence);
          }
        })
        .catch((error) => {
          console.error('Scan request failed:', error);
          setStatusByHash((prev) => ({ ...prev, [tx.hash]: 'CLEAN' }));
        })
        .finally(() => setForensicAnalyzing(false));
    },
    [target, demo]
  );

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-bg p-6">
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
          />

          <CostWidget benchmarkCost={costs.benchmark} actualCost={costs.actual} saved={costs.saved} requests={costs.requests} />
        </>
      )}
    </main>
  );
}
