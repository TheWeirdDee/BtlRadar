'use client';

type Verdict = 'SAFE' | 'RISKY' | 'TRAP';

interface VerdictBoxProps {
  verdict: Verdict | null;
  riskScore: number;
  summary: string;
  action: string;
  keyEvidence: string[];
}

const VERDICT_STYLES: Record<Verdict, { text: string; border: string; bg: string }> = {
  SAFE: { text: 'text-green', border: 'border-green', bg: 'bg-green/10' },
  RISKY: { text: 'text-yellow', border: 'border-yellow', bg: 'bg-yellow/10' },
  TRAP: { text: 'text-red', border: 'border-red', bg: 'bg-red/10' },
};

export default function VerdictBox({ verdict, riskScore, summary, action, keyEvidence }: VerdictBoxProps) {
  if (!verdict) return null;
  const styles = VERDICT_STYLES[verdict];

  return (
    <div className={`flex h-full flex-col border ${styles.border} ${styles.bg} font-mono min-h-0`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse bg-red" />
          <span className="text-sm tracking-wide text-text">Agent 3 · Judge</span>
        </div>
        <span className="text-xs text-muted">DeepSeek V4 Pro · via BTL</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <span className={`inline-block border px-3 py-1 text-sm font-medium tracking-wide ${styles.border} ${styles.text}`}>
          {verdict}
        </span>

        <div className={`mt-4 text-5xl font-medium ${styles.text}`}>{riskScore}%</div>
        <div className="text-xs text-muted">rug probability</div>

        <p className="mt-4 font-sans text-sm text-text">{summary}</p>
        <p className="mt-3 font-sans text-sm font-bold text-text">{action}</p>

        {keyEvidence.length > 0 && (
          <div className="mt-4 space-y-1">
            {keyEvidence.map((item, i) => (
              <div key={i} className="text-sm text-muted">
                <span className="text-muted">→ </span>
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
