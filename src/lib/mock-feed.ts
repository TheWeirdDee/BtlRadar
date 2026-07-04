// Demo transaction feed — plays back src/data/mock-feed.json on a timer.
// Falls back for both chains when no live WebSocket credentials are configured.

import type { Transaction, Chain } from './types';
import mockFeedData from '@/data/mock-feed.json';

interface MockTransaction {
  hash: string;
  amount: string;
  wallet: string;
  chain: Chain;
  flagged?: boolean;
}

const TICK_MS = 1500;
const PLANTED_INDEX = 4;
const PLANTED_DELAY_MS = 6000;

export function startMockFeed(onTx: (tx: Transaction) => void): () => void {
  const feed = mockFeedData as MockTransaction[];
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Sequential cadence of one emission every 1.5s, except the planted entry
  // at PLANTED_INDEX, which is pinned to fire at exactly T+45s. Later entries
  // resume the normal cadence from that point so the feed stays in order.
  let nextDelay = 0;
  feed.forEach((entry, index) => {
    const delay = index === PLANTED_INDEX ? PLANTED_DELAY_MS : nextDelay;
    nextDelay = delay + TICK_MS;

    timers.push(
      setTimeout(() => {
        onTx({
          hash: entry.hash,
          amount: entry.amount,
          wallet: entry.wallet,
          timestamp: Date.now(),
          chain: entry.chain,
        });
      }, delay)
    );
  });

  return () => {
    timers.forEach(clearTimeout);
  };
}
