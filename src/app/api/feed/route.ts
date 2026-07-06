// src/app/api/feed/route.ts
// SSE relay: bridges the server-only Alchemy/Helius/mock feeds (src/lib/feed.ts)
// to the browser, since those clients rely on non-public env vars and the `ws`
// package and cannot run client-side.

import { NextRequest } from 'next/server';
import { subscribeToFeed } from '@/lib/feed';
import type { Chain, Transaction } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HeliusTokenTransfer {
  mint?: string;
  tokenAmount?: number;
  fromUserAccount?: string;
}

interface HeliusTx {
  signature: string;
  timestamp?: number;
  feePayer?: string;
  tokenTransfers?: HeliusTokenTransfer[];
}

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

    return (data as HeliusTx[]).map((tx) => {
      const hash = tx.signature;
      const timestamp = tx.timestamp ? tx.timestamp * 1000 : Date.now();
      let amount = '0 tokens';
      let wallet = tx.feePayer || 'unknown';

      const transfer = tx.tokenTransfers?.find(
        (t) => t.mint?.toLowerCase() === address.toLowerCase()
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

// ERC-20 Transfer(address,address,uint256) topic
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

interface EthLog {
  transactionHash: string;
  topics: string[];
  data: string;
}

// Fetch recent EVM token transfers using eth_getLogs with a 9-block window.
// Alchemy free tier allows up to 10 blocks — we stay safely within that.
// Retries up to 3 windows (27 blocks back) to find at least one transfer.
async function fetchEVMHistory(address: string): Promise<Transaction[]> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return [];

  const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;

  try {
    // 1. Get the latest block number
    const blockRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    });
    const blockData = await blockRes.json() as { result?: string };
    if (!blockData.result) return [];
    const latestBlock = parseInt(blockData.result, 16);

    // 2. Try up to 3 windows of 9 blocks each (~90 seconds per window)
    for (let attempt = 0; attempt < 3; attempt++) {
      const toBlock = latestBlock - attempt * 9;
      const fromBlock = toBlock - 8; // 9-block window: [fromBlock, toBlock] inclusive
      const fromHex = '0x' + fromBlock.toString(16);
      const toHex = '0x' + toBlock.toString(16);

      const logRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            address,
            topics: [TRANSFER_TOPIC],
            fromBlock: fromHex,
            toBlock: toHex,
          }],
        }),
      });

      const logData = await logRes.json() as { result?: EthLog[]; error?: { message: string } };
      if (logData.error) {
        console.warn(`[feed history] eth_getLogs attempt ${attempt + 1} error:`, logData.error.message);
        continue;
      }

      const logs = logData.result ?? [];
      if (logs.length === 0) continue;

      // Parse up to 5 most recent logs — topics[1]=from, topics[2]=to, data=value
      return logs.slice(-5).reverse().map((log) => {
        const from = log.topics[1]
          ? '0x' + log.topics[1].slice(26)
          : 'unknown';
        const rawValue = BigInt(log.data || '0x0');
        // Display up to 6 decimal places; AAVE/DAI both use 18 decimals
        const value = Number(rawValue) / 1e18;
        const displayAmount = value > 0
          ? `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens`
          : '0 tokens';
        return {
          hash: log.transactionHash,
          amount: displayAmount,
          wallet: from,
          timestamp: Date.now(),
          chain: 'EVM' as const,
        };
      });
    }

    // No transfers found in any of the 3 windows
    return [];
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
