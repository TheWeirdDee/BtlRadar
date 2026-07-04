'use client';

import { useEffect, useRef, useState } from 'react';
import type { Chain, Transaction } from '@/lib/types';

type TxStatus = 'SCANNING' | 'CLEAN' | 'FLAGGED';

interface FeedRow extends Transaction {
  status: TxStatus;
}

interface TransactionFeedProps {
  address: string;
  chain: Chain;
  demo?: boolean;
  statusByHash?: Record<string, 'CLEAN' | 'FLAGGED'>;
  onTransaction?: (tx: Transaction) => void;
}

const MAX_ROWS = 20;

function truncate(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

const STATUS_STYLES: Record<TxStatus, string> = {
  CLEAN: 'text-green',
  SCANNING: 'text-muted',
  FLAGGED: 'text-yellow',
};

export default function TransactionFeed({ address, chain, demo, statusByHash, onTransaction }: TransactionFeedProps) {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const onTransactionRef = useRef(onTransaction);

  useEffect(() => {
    onTransactionRef.current = onTransaction;
  }, [onTransaction]);

  // Reset the visible feed when the target changes, following React's
  // "adjusting state during render" pattern instead of setState-in-effect.
  const feedKey = `${address}:${chain}:${demo}`;
  const [trackedKey, setTrackedKey] = useState(feedKey);
  if (feedKey !== trackedKey) {
    setTrackedKey(feedKey);
    setRows([]);
  }

  useEffect(() => {
    if (!address) return;

    const params = new URLSearchParams({ address, chain, demo: demo ? 'true' : 'false' });
    const source = new EventSource(`/api/feed?${params.toString()}`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      const tx: Transaction = JSON.parse(event.data);
      setRows((prev) => [...prev.slice(-(MAX_ROWS - 1)), { ...tx, status: 'SCANNING' }]);
      onTransactionRef.current?.(tx);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [address, chain, demo]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rows]);

  return (
    <div className="flex h-full flex-col border border-border bg-surface font-mono">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 ${connected ? 'bg-green animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm tracking-wide text-text">Agent 1 · Screener</span>
        </div>
        <span className="text-xs text-muted">deepseek-v4-flash · via BTL</span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-muted">Waiting for transactions…</div>
        )}
        {rows.map((row) => {
          const resolved = statusByHash?.[row.hash];
          const status: TxStatus = resolved ?? row.status;
          return (
            <div
              key={row.hash}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs"
            >
              <span className="text-text">{truncate(row.hash)}</span>
              <span className="text-muted">{row.amount}</span>
              <span className="text-muted">{truncate(row.wallet)}</span>
              <span className={`shrink-0 font-medium ${STATUS_STYLES[status]}`}>{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
