// Demo transaction feed — plays back src/data/mock-feed.json on a timer.
// Falls back for both chains when no live WebSocket credentials are configured.
//
// When scanning a non-BTL address, amounts are shown as generic "tokens"
// rather than "$BTL" so the demo data doesn't mislead.

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

// The demo is scripted around the $BTL contract address. For any other
// address, we strip the "$BTL" label from amounts so the demo data
// doesn't claim to be real $BTL transactions.
const BTL_DEMO_ADDRESS = '3bBQrzzq9DRXXFfC9nUno9m1MBm9Y7dVnBBK44bVpump';

function normaliseAmount(raw: string, targetAddress: string): string {
  if (targetAddress.toLowerCase() === BTL_DEMO_ADDRESS.toLowerCase()) return raw;
  // Replace "$BTL" label with generic "tokens"
  return raw.replace(/\$BTL/g, 'tokens');
}

// Deterministically convert a Solana base58 string to a hex-like EVM address/hash
function toEVMHash(solAddress: string, length: number): string {
  let hex = '';
  for (let i = 0; i < solAddress.length; i++) {
    hex += solAddress.charCodeAt(i).toString(16);
  }
  return '0x' + hex.substring(0, length).padEnd(length, '0');
}

export function startMockFeed(
  onTx: (tx: Transaction) => void,
  targetAddress = BTL_DEMO_ADDRESS,
  chain: Chain = 'SOL'
): () => void {
  const feed = mockFeedData as MockTransaction[];
  const timers: ReturnType<typeof setTimeout>[] = [];

  const useEVM = chain === 'EVM';

  // Sequential cadence of one emission every 1.5s, except the planted entry
  // at PLANTED_INDEX, which is pinned to fire at exactly PLANTED_DELAY_MS.
  // Later entries resume the normal cadence from that point so the feed stays in order.
  let nextDelay = 0;
  const isBTL = targetAddress.toLowerCase() === BTL_DEMO_ADDRESS.toLowerCase();

  feed.forEach((entry, index) => {
    const delay = index === PLANTED_INDEX ? PLANTED_DELAY_MS : nextDelay;
    nextDelay = delay + TICK_MS;

    timers.push(
      setTimeout(() => {
        let amount = normaliseAmount(entry.amount, targetAddress);
        let wallet = entry.wallet;

        if (!isBTL && index === PLANTED_INDEX) {
          amount = "120 tokens";
          wallet = useEVM 
            ? "0x35761a6b326d50715735764e3972547a59634b61" 
            : "6yUvT3nWzKqP8xRcMdJeLo4sYbHfGz1aXk9mNrQjT5oD";
        }

        onTx({
          hash: useEVM ? toEVMHash(entry.hash, 64) : entry.hash,
          amount,
          wallet: useEVM ? toEVMHash(wallet, 40) : wallet,
          timestamp: Date.now(),
          chain,
        });
      }, delay)
    );
  });

  return () => {
    timers.forEach(clearTimeout);
  };
}
