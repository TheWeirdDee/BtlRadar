// Solana transaction feed via Helius's WebSocket RPC.
// Server-only: relies on HELIUS_API_KEY, which is not exposed to the browser.
//
// logsSubscribe only reports a signature, so each event is enriched with a
// getTransaction lookup to recover the transfer amount and wallet.

import WebSocket from 'ws';
import type { Transaction } from './types';

const HELIUS_WS_URL = `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

interface HeliusTokenBalance {
  mint: string;
  uiTokenAmount: { uiAmount: number | null };
}

interface HeliusTransactionResult {
  transaction?: {
    message?: {
      accountKeys?: (string | { pubkey: string })[];
    };
  };
  meta?: {
    preTokenBalances?: HeliusTokenBalance[];
    postTokenBalances?: HeliusTokenBalance[];
  };
}

// Enrichment calls are serialized through this queue with a minimum gap
// between each — tested against a high-volume mint (USDC) and unthrottled
// enrichment immediately hit Helius's rate limit (constant 429s, ~79
// req/s), so every enrichment silently fell back to 'N/A'/'unknown'. 5/s
// stays comfortably under free-tier limits while still resolving every
// transaction (just delayed under heavy bursts, not dropped).
const MIN_ENRICH_INTERVAL_MS = 200;
let enrichQueue: Promise<unknown> = Promise.resolve();

function throttledFetchTransactionDetails(
  signature: string,
  mintAddress: string
): Promise<{ amount: string; wallet: string }> {
  const result = enrichQueue.then(async () => {
    const details = await fetchTransactionDetails(signature, mintAddress);
    await new Promise((resolve) => setTimeout(resolve, MIN_ENRICH_INTERVAL_MS));
    return details;
  });
  // Keep the chain alive even if this call's fetch rejected.
  enrichQueue = result.catch(() => undefined);
  return result;
}

async function fetchTransactionDetails(
  signature: string,
  mintAddress: string,
  retries = 3
): Promise<{ amount: string; wallet: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      });

      const { result }: { result: HeliusTransactionResult | null } = await response.json();
      if (result) {
        const firstKey = result.transaction?.message?.accountKeys?.[0];
        const wallet = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey ?? 'unknown';

        const pre = result.meta?.preTokenBalances?.find(b => b.mint === mintAddress);
        const post = result.meta?.postTokenBalances?.find(b => b.mint === mintAddress);

        const preAmt = pre?.uiTokenAmount.uiAmount ?? 0;
        const postAmt = post?.uiTokenAmount.uiAmount ?? 0;

        if (pre || post) {
          const delta = postAmt - preAmt;
          return { amount: `${Math.abs(delta).toLocaleString()} tokens`, wallet };
        }
        return { amount: '0 tokens', wallet };
      }
    } catch (error) {
      console.error(`Helius feed: getTransaction attempt ${attempt} failed`, error);
    }
    // Wait before retrying (indexing delay)
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  return { amount: 'N/A', wallet: 'unknown' };
}

export function subscribeToSolanaTransactions(
  address: string,
  onTx: (tx: Transaction) => void
): () => void {
  const ws = new WebSocket(HELIUS_WS_URL);

  ws.on('open', () => {
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'logsSubscribe',
      params: [{ mentions: [address] }, { commitment: 'confirmed' }],
    }));
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    (async () => {
      try {
        const msg = JSON.parse(raw.toString());
        const signature = msg.params?.result?.value?.signature;
        if (!signature) return;

        const { amount, wallet } = await throttledFetchTransactionDetails(signature, address);

        onTx({
          hash: signature,
          amount,
          wallet,
          timestamp: Date.now(),
          chain: 'SOL',
        });
      } catch (error) {
        console.error('Helius feed: failed to process message', error);
      }
    })();
  });

  ws.on('error', (error) => {
    console.error('Helius feed error:', error);
  });

  return () => {
    ws.close();
  };
}
