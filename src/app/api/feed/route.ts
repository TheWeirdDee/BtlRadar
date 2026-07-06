// src/app/api/feed/route.ts
// SSE relay: bridges the server-only Alchemy/Helius/mock feeds (src/lib/feed.ts)
// to the browser, since those clients rely on non-public env vars and the `ws`
// package and cannot run client-side.

import { NextRequest } from 'next/server';
import { subscribeToFeed } from '@/lib/feed';
import type { Chain, Transaction } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fetch the last 5 Solana token transfers using Helius parsed transactions API
async function fetchSolanaHistory(address: string): Promise<Transaction[]> {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return [];
    
    const res = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=5`
    );
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((tx: any) => {
      const hash = tx.signature;
      const timestamp = tx.timestamp ? tx.timestamp * 1000 : Date.now();
      let amount = '0 tokens';
      let wallet = tx.feePayer || 'unknown';

      const transfer = tx.tokenTransfers?.find(
        (t: any) => t.mint?.toLowerCase() === address.toLowerCase()
      );
      if (transfer) {
        amount = `${transfer.tokenAmount} tokens`;
        wallet = transfer.fromUserAccount || wallet;
      }
      return { hash, amount, wallet, timestamp, chain: 'SOL' };
    });
  } catch (err) {
    console.error('[feed history] Failed to fetch Solana history:', err);
    return [];
  }
}

// Fetch the last 5 EVM token transfers using Alchemy Asset Transfers API
async function fetchEVMHistory(address: string): Promise<Transaction[]> {
  try {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) return [];

    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          contractAddresses: [address],
          category: ['erc20'],
          maxCount: 5,
          order: 'desc'
        }],
      }),
    });

    const { result } = await response.json();
    if (!result?.transfers || !Array.isArray(result.transfers)) return [];

    return result.transfers.map((tx: any) => ({
      hash: tx.hash,
      amount: `${tx.value || 0} tokens`,
      wallet: tx.from || 'unknown',
      timestamp: Date.now(),
      chain: 'EVM'
    }));
  } catch (err) {
    console.error('[feed history] Failed to fetch EVM history:', err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = (searchParams.get('chain') === 'SOL' ? 'SOL' : 'EVM') as Chain;
  const demo = searchParams.get('demo') === 'true';

  if (!address) {
    return new Response('address is required', { status: 400 });
  }

  // Fetch historical transactions first to seed the feed instantly in Live Mode
  let history: Transaction[] = [];
  if (!demo) {
    if (chain === 'SOL') {
      history = await fetchSolanaHistory(address);
    } else {
      history = await fetchEVMHistory(address);
    }
  }

  const encoder = new TextEncoder();
  let active = true;
  let unsubscribe: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      // Send historical records immediately to hydrate the UI and trigger initial scan
      for (const tx of history) {
        if (!active) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(tx)}\n\n`));
      }

      // Then subscribe to live transaction streams
      unsubscribe = subscribeToFeed(
        chain,
        address,
        (tx) => {
          if (!active) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(tx)}\n\n`));
          } catch {
            active = false;
          }
        },
        { demo }
      );
    },
    cancel() {
      active = false;
      unsubscribe();
    },
  });

  request.signal.addEventListener('abort', () => {
    active = false;
    unsubscribe();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
