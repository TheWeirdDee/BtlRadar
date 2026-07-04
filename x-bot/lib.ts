// x-bot/lib.ts
// Pure logic (address detection, scan call, tweet formatting) kept apart
// from the polling/X API wiring in index.ts so it can be tested without
// touching the network.

export type Chain = 'EVM' | 'SOL';

export interface ScanResult {
  verdict: 'SAFE' | 'RISKY' | 'TRAP';
  risk_score: number;
  summary: string;
  benchmark_cost: number;
  actual_cost: number;
  saved: number;
}

const EVM_REGEX = /0x[a-fA-F0-9]{40}/;
// Base58, 32-44 chars — a reasonable approximation for a Solana address/mint.
const SOL_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

export function detectChain(text: string): { address: string; chain: Chain } | null {
  const evmMatch = text.match(EVM_REGEX);
  if (evmMatch) return { address: evmMatch[0], chain: 'EVM' };
  const solMatch = text.match(SOL_REGEX);
  if (solMatch) return { address: solMatch[0], chain: 'SOL' };
  return null;
}

export async function scanContract(appUrl: string, address: string, chain: Chain): Promise<ScanResult> {
  const response = await fetch(`${appUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractAddress: address, chain }),
  });
  if (!response.ok) throw new Error(`Scan failed: ${response.status}`);
  return (await response.json()) as ScanResult;
}

const VERDICT_EMOJI: Record<ScanResult['verdict'], string> = {
  SAFE: '✅',
  RISKY: '⚠️',
  TRAP: '🚨',
};

export function formatTweet(result: ScanResult, address: string, chain: Chain): string {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const savedPct = result.benchmark_cost > 0 ? Math.round((result.saved / result.benchmark_cost) * 100) : 0;

  const header = `${VERDICT_EMOJI[result.verdict]} BTL RADAR: ${shortAddr} (${chain})\n\n`;
  const verdictLine = `${result.verdict} · ${result.risk_score}% rug probability\n\n`;
  const footer = `\n\nPowered by @BadTheoryLabs Runtime · ${savedPct}% cheaper than raw GPT-4o`;

  // Compute the summary's budget from the other pieces' real length, rather
  // than a guessed constant — otherwise the fixed footer risks getting cut
  // off mid-word if it's ever longer than assumed.
  const maxSummaryLen = Math.max(0, 280 - header.length - verdictLine.length - footer.length);
  const summary = (result.summary ?? '').slice(0, maxSummaryLen);

  return `${header}${verdictLine}${summary}${footer}`;
}
