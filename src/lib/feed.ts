// Unified transaction feed. Components should import from here only —
// never directly from alchemy.ts, helius.ts, or mock-feed.ts — so demo mode
// and chain selection stay in one place.

import type { Chain, Transaction } from './types';
import { subscribeToEVMTransactions } from './alchemy';
import { subscribeToSolanaTransactions } from './helius';
import { startMockFeed } from './mock-feed';

export type { Transaction, Chain };

export function subscribeToFeed(
  chain: Chain,
  address: string,
  onTx: (tx: Transaction) => void,
  options?: { demo?: boolean }
): () => void {
  const demoMode = options?.demo ?? process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (demoMode) {
    return startMockFeed(onTx);
  }

  return chain === 'SOL'
    ? subscribeToSolanaTransactions(address, onTx)
    : subscribeToEVMTransactions(address, onTx);
}
