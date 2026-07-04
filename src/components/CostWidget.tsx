'use client';

interface CostWidgetProps {
  benchmarkCost: number;
  actualCost: number;
  saved: number;
  requests: number;
}

function formatCost(value: number): string {
  return `$${value.toFixed(4)}`;
}

export default function CostWidget({ benchmarkCost, actualCost, saved, requests }: CostWidgetProps) {
  const savedPercent = benchmarkCost > 0 ? Math.round((saved / benchmarkCost) * 100) : 0;

  return (
    <div className="grid w-full grid-cols-2 gap-4 border border-border bg-surface px-6 py-4 font-mono text-sm sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Benchmark cost</span>
        <span className="text-muted line-through">{formatCost(benchmarkCost)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Actual cost</span>
        <span className="text-accent">{formatCost(actualCost)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Saved</span>
        <span className="font-bold text-accent">{savedPercent}%</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Requests routed</span>
        <span className="text-text">{requests.toLocaleString()}</span>
      </div>
    </div>
  );
}
