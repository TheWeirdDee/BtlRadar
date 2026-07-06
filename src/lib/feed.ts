// Unified transaction feed. Components should import from here only —
// never directly from alchemy.ts, helius.ts, or mock-feed.ts — so demo mode
// and chain selection stay in one place.

import type { Chain, Transaction } from './types';
import { subscribeToEVMTransactions } from './alchemy';
import { subscribeToSolanaTransactions } from './helius';
import { startMockFeed } from './mock-feed';

export type { Transaction, Chain };

const hasHelius = Boolean(process.env.HELIUS_API_KEY);
const hasAlchemy = Boolean(process.env.ALCHEMY_API_KEY);

export function subscribeToFeed(
  chain: Chain,
  address: string,
  onTx: (tx: Transaction) => void,
  options?: { demo?: boolean }
): () => void {
  const demoMode = options?.demo ?? process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Always use mock in demo mode
  if (demoMode) {
    return startMockFeed(onTx, address);
  }

  // If the relevant API key is absent, fall back to mock so the UI
  // isn't stuck on "Waiting for transactions…" indefinitely.
  if (chain === 'SOL') {
    if (!hasHelius) {
      console.warn('[feed] HELIUS_API_KEY not set — using mock feed');
      return startMockFeed(onTx, address);
    }
    return subscribeToSolanaTransactions(address, onTx);
  }

  if (!hasAlchemy) {
    console.warn('[feed] ALCHEMY_API_KEY not set — using mock feed');
    return startMockFeed(onTx, address);
  }
  return subscribeToEVMTransactions(address, onTx);
}
