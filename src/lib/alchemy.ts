// EVM pending-transaction feed via Alchemy's enhanced WebSocket API.
// Server-only: relies on ALCHEMY_API_KEY, which is not exposed to the browser.

import WebSocket from 'ws';
import type { Transaction } from './types';

const ALCHEMY_WS_URL = `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

interface AlchemyPendingTxResult {
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
}

// Wei (hex) -> "1.2345 ETH", done in BigInt to avoid float precision loss.
function formatEth(weiHex: string): string {
  try {
    const wei = BigInt(weiHex);
    const weiPerEth = BigInt('1000000000000000000');
    const whole = wei / weiPerEth;
    const frac = wei % weiPerEth;
    const fracStr = frac.toString().padStart(18, '0').slice(0, 4);
    return `${whole}.${fracStr} ETH`;
  } catch {
    return '0.0000 ETH';
  }
}

export function subscribeToEVMTransactions(
  contractAddress: string,
  onTx: (tx: Transaction) => void
): () => void {
  const ws = new WebSocket(ALCHEMY_WS_URL);
  const target = contractAddress.toLowerCase();

  ws.on('open', () => {
    // Subscribed unfiltered and filtered client-side below. The server-side
    // `toAddress` filter on this method returned zero events in testing
    // (verified: unfiltered delivers a firehose immediately, so the
    // subscription itself works — the address filter appears gated on this
    // account's tier) despite acking the subscription normally, so this is
    // the version that actually works regardless of plan.
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: ['alchemy_pendingTransactions'],
    }));
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    try {
      const msg = JSON.parse(raw.toString());
      const result: AlchemyPendingTxResult | undefined = msg.params?.result;
      if (!result?.hash || result.to?.toLowerCase() !== target) return;

      onTx({
        hash: result.hash,
        amount: formatEth(result.value ?? '0x0'),
        wallet: result.from ?? 'unknown',
        timestamp: Date.now(),
        chain: 'EVM',
      });
    } catch (error) {
      console.error('Alchemy feed: failed to parse message', error);
    }
  });

  ws.on('error', (error) => {
    console.error('Alchemy feed error:', error);
  });

  return () => {
    ws.close();
  };
}
