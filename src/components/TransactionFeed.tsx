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
  maxTxs?: number;
}

// Only keep this many rows visible in the feed at once
const PAGE_SIZE = 10;

function truncate(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

const STATUS_STYLES: Record<TxStatus, string> = {
  CLEAN: 'text-green',
  SCANNING: 'text-muted animate-pulse',
  FLAGGED: 'text-yellow font-bold',
};

export default function TransactionFeed({ address, chain, demo, statusByHash, onTransaction, maxTxs }: TransactionFeedProps) {
  // allRows holds the full history; we paginate visually
  const [allRows, setAllRows] = useState<FeedRow[]>([]);
  const [page, setPage] = useState(0); // 0 = latest page
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const onTransactionRef = useRef(onTransaction);
  const pausedRef = useRef(paused);

  useEffect(() => { onTransactionRef.current = onTransaction; }, [onTransaction]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Reset on target change
  const feedKey = `${address}:${chain}:${demo}`;
  const [trackedKey, setTrackedKey] = useState(feedKey);
  if (feedKey !== trackedKey) {
    setTrackedKey(feedKey);
    setAllRows([]);
    setPage(0);
    setPaused(false);
  }

  useEffect(() => {
    if (!address) return;

    const useMock = Boolean(demo);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource;

    function connect(forceMock: boolean) {
      const params = new URLSearchParams({ address, chain, demo: forceMock ? 'true' : 'false' });
      source = new EventSource(`/api/feed?${params.toString()}`);

      source.onopen = () => setConnected(true);
      source.onerror = () => setConnected(false);
      source.onmessage = (event) => {
        // Cancel the silence timeout once we get the first real tx
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        if (pausedRef.current) return;
        const tx: Transaction = JSON.parse(event.data);
        setAllRows((prev) => {
          const updated = [{ ...tx, status: 'SCANNING' as TxStatus }, ...prev];
          if (maxTxs && updated.length >= maxTxs) {
            setTimeout(() => setPaused(true), 0);
          }
          return updated.slice(0, 200);
        });
        onTransactionRef.current?.(tx);
      };
    }

    connect(useMock);

    // If the live feed delivers nothing after 10s, switch to mock so the UI
    // isn't permanently stuck on "Waiting for transactions…"
    if (!useMock) {
      timeoutId = setTimeout(() => {
        console.info('[feed] No live transactions in 10s — switching to mock feed');
        source.close();
        connect(true); // reconnect with demo=true
      }, 10_000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      source.close();
      setConnected(false);
    };
  }, [address, chain, demo, maxTxs]);

  // Resolve current page's rows — page 0 = newest
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = allRows.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  // Scroll list to top whenever page changes
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  }, [clampedPage]);

  return (
    <div className="flex h-full flex-col border border-border bg-surface font-mono min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 ${connected ? (paused ? 'bg-yellow' : 'bg-green animate-pulse') : 'bg-muted'}`} />
          <span className="text-sm tracking-wide text-text">Agent 1 · Screener</span>
        </div>
        <div className="flex items-center gap-3">
          {connected && (
            <button
              onClick={() => setPaused((p) => !p)}
              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border transition-colors select-none ${
                paused
                  ? 'border-yellow/40 text-yellow hover:border-yellow'
                  : 'border-border text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          <span className="text-xs text-muted">DeepSeek V4 Flash · via BTL</span>
        </div>
      </div>

      {/* Row count badge */}
      {allRows.length > 0 && (
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-1 text-[10px] text-zinc-600 font-mono">
          <span>{allRows.length} txs captured</span>
          <span>page {clampedPage + 1} / {totalPages}</span>
        </div>
      )}

      {/* Transaction rows */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {pageRows.length === 0 && (
          <div className="px-4 py-6 text-sm text-muted">
            {paused ? 'Feed paused. Click Resume to continue.' : 'Waiting for transactions…'}
          </div>
        )}
        {pageRows.map((row) => {
          const resolved = statusByHash?.[row.hash];
          const status: TxStatus = resolved ?? row.status;
          return (
            <div
              key={row.hash}
              className={`flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs transition-colors ${
                status === 'FLAGGED' ? 'bg-yellow/5' : ''
              }`}
            >
              <span className="text-text">{truncate(row.hash)}</span>
              <span className="text-muted">{row.amount}</span>
              <span className="hidden sm:block text-muted">{truncate(row.wallet)}</span>
              <span className={`shrink-0 font-medium ${STATUS_STYLES[status]}`}>{status}</span>
            </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] font-mono text-zinc-500">
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={clampedPage >= totalPages - 1}
            className="uppercase tracking-widest hover:text-zinc-300 disabled:opacity-30 transition-colors select-none"
          >
            ← Older
          </button>
          <span className="text-zinc-600">{clampedPage * PAGE_SIZE + 1}–{Math.min((clampedPage + 1) * PAGE_SIZE, allRows.length)} of {allRows.length}</span>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={clampedPage === 0}
            className="uppercase tracking-widest hover:text-zinc-300 disabled:opacity-30 transition-colors select-none"
          >
            Newer →
          </button>
        </div>
      )}
    </div>
  );
}
