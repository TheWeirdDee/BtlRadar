// telegram-bot/lib.ts
// Pure logic (address detection, scan call, message formatting) kept apart
// from the Telegraf wiring in index.ts so it can be tested without touching
// the network or launching the bot.

export type Chain = 'EVM' | 'SOL';

export interface ScanResult {
  verdict: 'SAFE' | 'RISKY' | 'TRAP';
  risk_score: number;
  summary: string;
  action: string;
  key_evidence: string[];
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

export function formatVerdict(result: ScanResult, address: string, chain: Chain): string {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const verdictEmoji: Record<ScanResult['verdict'], string> = {
    SAFE: '✅',
    RISKY: '⚠️',
    TRAP: '🚨',
  };

  const verdictLabel: Record<ScanResult['verdict'], string> = {
    SAFE: 'SAFE',
    RISKY: 'RISKY',
    TRAP: 'HIGH RISK — LIKELY RUG',
  };

  let message = `🔍 *BTL RADAR SCAN*\n\n`;
  message += `Contract: \`${shortAddr}\`\n`;
  message += `Chain: ${chain}\n\n`;
  message += `${verdictEmoji[result.verdict]} *${verdictLabel[result.verdict]}*\n`;
  message += `Rug probability: *${result.risk_score}%*\n\n`;
  message += `${result.summary}\n\n`;

  if (result.action) {
    message += `→ *${result.action}*\n\n`;
  }

  if (result.key_evidence && result.key_evidence.length > 0) {
    message += `*Evidence:*\n`;
    result.key_evidence.slice(0, 3).forEach((e) => {
      message += `• ${e}\n`;
    });
    message += '\n';
  }

  const savedPct = result.benchmark_cost > 0 ? Math.round((result.saved / result.benchmark_cost) * 100) : 0;

  message += `─────────────────\n`;
  message += `💰 BTL cost: $${result.actual_cost.toFixed(4)} `;
  message += `(saved ${savedPct}% vs raw GPT-4o)\n\n`;
  message += `_Powered by [BTL Runtime](https://runtime.badtheorylabs.com)_`;

  return message;
}
