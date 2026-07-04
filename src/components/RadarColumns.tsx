'use client';

import TransactionFeed from './TransactionFeed';
import ForensicAnalysis from './ForensicAnalysis';
import VerdictBox from './VerdictBox';
import type { Chain, Transaction } from '@/lib/types';

type Verdict = 'SAFE' | 'RISKY' | 'TRAP';

interface RadarColumnsProps {
  address: string;
  chain: Chain;
  demo: boolean;
  onTransaction: (tx: Transaction) => void;
  statusByHash: Record<string, 'CLEAN' | 'FLAGGED'>;
  forensicActive: boolean;
  forensicFindings: string[];
  forensicAnalyzing: boolean;
  verdict: Verdict | null;
  riskScore: number;
  summary: string;
  action: string;
  keyEvidence: string[];
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center border border-dashed border-border font-mono text-sm text-muted">
      {label}
    </div>
  );
}

export default function RadarColumns({
  address,
  chain,
  demo,
  onTransaction,
  statusByHash,
  forensicActive,
  forensicFindings,
  forensicAnalyzing,
  verdict,
  riskScore,
  summary,
  action,
  keyEvidence,
}: RadarColumnsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:h-[520px] lg:grid-cols-3">
      <div className="h-[400px] lg:h-full">
        <TransactionFeed
          address={address}
          chain={chain}
          demo={demo}
          statusByHash={statusByHash}
          onTransaction={onTransaction}
        />
      </div>

      <div className="h-[400px] lg:h-full">
        {forensicActive ? (
          <ForensicAnalysis active={forensicActive} findings={forensicFindings} analyzing={forensicAnalyzing} />
        ) : (
          <Placeholder label="Agent 2 · awaiting escalation" />
        )}
      </div>

      <div className="h-[400px] lg:h-full">
        {verdict ? (
          <VerdictBox
            verdict={verdict}
            riskScore={riskScore}
            summary={summary}
            action={action}
            keyEvidence={keyEvidence}
          />
        ) : (
          <Placeholder label="Agent 3 · awaiting verdict" />
        )}
      </div>
    </div>
  );
}
