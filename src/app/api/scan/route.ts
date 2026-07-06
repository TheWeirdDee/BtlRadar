// src/app/api/scan/route.ts
// BTL Radar — Three-agent cascading pipeline
// Agent 1: Screener (cheap, fast, always running)
// Agent 2: Forensic (mid-tier, fires on flag)
// Agent 3: Judge (strongest, fires on escalation)

import { NextRequest, NextResponse } from 'next/server';
import { callBTL, extractJSON } from '@/lib/btl';

export const maxDuration = 60; // Allow up to 60 seconds execution limit on Vercel to prevent timeouts during cascades

// deepseek-v4-flash and deepseek-v4-pro are deepseek-direct routes covered
// by the hackathon's 10M DeepSeek token grant (x-btl-customer-charge: 0).
// gpt-4o-mini routes through OpenRouter and bills the workspace balance.
const MODELS = {
  screener: 'deepseek-v4-flash',  // free, fast, runs on every batch
  forensic: 'gpt-4o-mini',        // mid-tier, fires only on a flag
  judge: 'deepseek-v4-pro',       // deep-reasoning pass, fires on escalation only
} as const;
import { saveScan, getMemory, formatMemoryContextWithCurrent, type ScanRecord } from '@/lib/memory';

const KNOWN_SAFE_CONTRACTS: Record<string, { verdict: 'SAFE'; risk_score: number; summary: string }> = {
  // Solana
  'epjfwdd5aufqssqem2qn1xzybapc8gweggkzwytdt1v': {
    verdict: 'SAFE',
    risk_score: 4,
    summary: 'USD Coin (USDC) is a regulated, asset-backed stablecoin pegged to the US Dollar. Safe contract structure.',
  },
  'so11111111111111111111111111111111111111112': {
    verdict: 'SAFE',
    risk_score: 2,
    summary: 'Wrapped SOL (wSOL) is the native Solana utility wrapper. Verified contract deployed by the Solana Foundation.',
  },
  // EVM
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    verdict: 'SAFE',
    risk_score: 3,
    summary: 'USD Coin (USDC) is a fully reserved, regulated stablecoin. Deployed by Circle, audited, and globally trusted.',
  },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
    verdict: 'SAFE',
    risk_score: 2,
    summary: 'Wrapped Bitcoin (WBTC) is a 1:1 Bitcoin-backed token on Ethereum. Managed by a trusted multi-sig custodian.',
  },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    verdict: 'SAFE',
    risk_score: 1,
    summary: 'Wrapped Ether (WETH) is the canonical utility wrapper for Ether on Ethereum. Deployed as a core immutable contract.',
  },
};

interface Transaction {
  hash: string;
  amount: string;
  wallet: string;
  timestamp: number;
  type?: string;
}

interface ScreenerVerdict {
  flagged: boolean;
  suspicious_hashes: string[];
  flags: string[];
  threat_score: number;
}

interface ForensicVerdict {
  escalate: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: string[];
  wallet_risk: number;
  pattern_matches: string[];
}

interface JudgeVerdict {
  verdict: 'SAFE' | 'RISKY' | 'TRAP';
  rug_probability: number;
  summary: string;
  action: string;
  key_evidence: string[];
}

// AGENT 1: High-speed screener
// Job: flag or clear every transaction quickly
async function agent1Screen(transactions: Transaction[], contractAddress: string) {
  const txList = transactions.map((tx, idx) =>
    `Tx #${idx + 1} | Hash: ${tx.hash} | Amount: ${tx.amount} | Wallet: ${tx.wallet}`
  ).join('\n');

  const result = await callBTL(
    MODELS.screener,
    [
      {
        role: 'system',
        content: `You are a high-speed blockchain transaction screener. Analyze transactions for red flags: large dev wallet movements, sudden liquidity drops, new wallet activity, unusual volume spikes, honeypot patterns. Respond ONLY with valid JSON in this exact format: {"flagged": true/false, "suspicious_hashes": ["0x..."], "flags": ["flag1", "flag2"], "threat_score": 0-100}. Be fast and decisive.`
      },
      {
        role: 'user',
        content: `Contract: ${contractAddress}\n\nRecent transactions:\n${txList}\n\nScreen these transactions. Flag anything suspicious.`
      }
    ],
    2000 // DeepSeek v4 reasoning tokens count toward max_tokens; too low truncates the JSON
  );

  const fallback: ScreenerVerdict = { flagged: false, suspicious_hashes: [], flags: [], threat_score: 0 };
  let parsed = fallback;
  try {
    parsed = { ...fallback, ...extractJSON<Partial<ScreenerVerdict>>(result.content) };
  } catch {}
  return { ...parsed, cost: result.customerCharge, benchmarkCost: result.benchmarkCost };
}

// AGENT 2: Forensic analyst
// Job: deep-dive on flagged transaction, wallet history, rug pattern matching
async function agent2Forensic(
  flaggedTx: Transaction,
  contractAddress: string,
  initialFlags: string[]
) {
  const result = await callBTL(
    MODELS.forensic,
    [
      {
        role: 'system',
        content: `You are a forensic blockchain analyst specializing in rug pull detection. Given a flagged transaction and initial flags, perform deep analysis. 
First, recognize if the contract address is a highly established, reputable blue-chip DeFi protocol or native token (e.g. Aave AAVE, DAI, WBTC, WETH, etc.). If it is a verified safe blue-chip contract, note that the flagged activity is likely normal utility behavior or misattributed dust transactions, and do not make up fake rug pull findings or code vulnerabilities for it.
Otherwise, perform a thorough pattern analysis of the flagged transaction: look for deployer wallet connections, wallet age, prior rug history patterns, liquidity manipulation, honeypot mechanics, and unlimited token approvals. 
Respond ONLY with valid JSON: {"escalate": true/false, "risk_level": "LOW/MEDIUM/HIGH/CRITICAL", "findings": ["finding1"], "wallet_risk": 0-100, "pattern_matches": ["pattern1"]}`
      },
      {
        role: 'user',
        content: `Contract: ${contractAddress}
Flagged transaction: ${flaggedTx.hash}
Wallet: ${flaggedTx.wallet}
Amount: ${flaggedTx.amount}
Initial flags: ${initialFlags.join(', ')}

Perform forensic analysis. Should this escalate to full verdict?`
      }
    ],
    2000
  );

  const fallback: ForensicVerdict = { escalate: false, risk_level: 'LOW', findings: [], wallet_risk: 0, pattern_matches: [] };
  let parsed = fallback;
  try {
    parsed = { ...fallback, ...extractJSON<Partial<ForensicVerdict>>(result.content) };
  } catch {}
  return { ...parsed, cost: result.customerCharge, benchmarkCost: result.benchmarkCost };
}

// AGENT 3: Tactical judge
// Job: plain-English verdict, rug probability, alert content
async function agent3Judge(
  contractAddress: string,
  chain: string,
  allFlags: string[],
  forensicFindings: string[],
  walletRisk: number
) {
  const result = await callBTL(
    MODELS.judge,
    [
      {
        role: 'system',
        content: `You are a final security judge for crypto token safety. You receive aggregated evidence from two prior AI agents and must produce a definitive, plain-English verdict that a non-technical user can act on immediately. Be direct, specific, and actionable. Respond ONLY with valid JSON: {"verdict": "SAFE/RISKY/TRAP", "rug_probability": 0-100, "summary": "plain English summary in 2-3 sentences", "action": "what the user should do right now", "key_evidence": ["evidence1", "evidence2"]}`
      },
      {
        role: 'user',
        content: `Contract: ${contractAddress}
Chain: ${chain}
Wallet risk score: ${walletRisk}/100

Screener flags: ${allFlags.join(', ')}
Forensic findings: ${forensicFindings.join(', ')}

Deliver the final verdict. What is this token and what should the user do?`
      }
    ],
    3000
  );

  const fallback: JudgeVerdict = {
    verdict: 'RISKY',
    rug_probability: 50,
    summary: 'Unable to complete full analysis. Exercise caution.',
    action: 'Do not invest until further research.',
    key_evidence: [],
  };
  let parsed = fallback;
  try {
    parsed = { ...fallback, ...extractJSON<Partial<JudgeVerdict>>(result.content) };
  } catch {}
  return { ...parsed, cost: result.customerCharge, benchmarkCost: result.benchmarkCost };
}

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, chain, transactions } = await request.json();

    if (!contractAddress) {
      return NextResponse.json({ error: 'Contract address required' }, { status: 400 });
    }

    const resolvedChain = chain || 'EVM';

    // Retrieve persistent memory (RetainDB simulation) before the scan runs
    const memory = await getMemory(contractAddress);

    // ── KNOWN SAFE SHORT-CIRCUIT ──────────────────────────────────────────
    const normalizedAddress = contractAddress.toLowerCase();
    const knownSafe = KNOWN_SAFE_CONTRACTS[normalizedAddress];

    if (knownSafe) {
      const scanResult = {
        verdict: knownSafe.verdict,
        risk_score: knownSafe.risk_score,
        flags: [] as string[],
        summary: knownSafe.summary,
        action: 'No immediate action required.',
        key_evidence: [] as string[],
        suspicious_hashes: [] as string[],
        agent1_cost: 0,
        agent2_cost: null,
        agent3_cost: null,
        benchmark_cost: 0.02,
        actual_cost: 0,
        saved: 0.02,
        escalated_to_agent2: false,
        escalated_to_agent3: false,
      };

      await persistScan(contractAddress, resolvedChain, scanResult);
      const memoryContext = formatMemoryContextWithCurrent(memory, scanResult.risk_score);
      return NextResponse.json({ ...scanResult, memory: memoryContext });
    }

    // Use mock transactions if none provided (demo mode)
    const txData: Transaction[] = transactions || getMockTransactions();

    let totalActualCost = 0;
    let totalBenchmarkCost = 0;

    // AGENT 1: Screen all transactions
    const screening = await agent1Screen(txData, contractAddress);
    totalActualCost += screening.cost;
    totalBenchmarkCost += screening.benchmarkCost;

    if (!screening.flagged || screening.suspicious_hashes.length === 0) {
      // SAFE — no escalation needed
      const scanResult = {
        verdict: 'SAFE' as const,
        risk_score: Math.max(0, Math.min(100, Math.round(screening.threat_score))),
        flags: [],
        summary: 'All transactions appear normal. No suspicious patterns detected.',
        action: 'No immediate action required.',
        key_evidence: [],
        suspicious_hashes: [] as string[],
        agent1_cost: screening.cost,
        agent2_cost: null,
        agent3_cost: null,
        benchmark_cost: totalBenchmarkCost,
        actual_cost: totalActualCost,
        saved: totalBenchmarkCost - totalActualCost,
        escalated_to_agent2: false,
        escalated_to_agent3: false,
      };

      await persistScan(contractAddress, resolvedChain, scanResult);
      const memoryContext = formatMemoryContextWithCurrent(memory, scanResult.risk_score);
      return NextResponse.json({ ...scanResult, memory: memoryContext });
    }

    // AGENT 2: Forensic analysis on flagged transaction
    const suspiciousTx = txData.find(tx => screening.suspicious_hashes.includes(tx.hash)) || txData[0];
    const forensic = await agent2Forensic(suspiciousTx, contractAddress, screening.flags);
    totalActualCost += forensic.cost;
    totalBenchmarkCost += forensic.benchmarkCost;

    if (!forensic.escalate || forensic.risk_level === 'LOW') {
      // RISKY but not critical
      const scanResult = {
        verdict: 'RISKY' as const,
        risk_score: forensic.wallet_risk,
        flags: [...screening.flags, ...forensic.findings],
        summary: `Suspicious activity detected. Risk level: ${forensic.risk_level}. Exercise caution.`,
        action: 'Research thoroughly before investing.',
        key_evidence: forensic.findings,
        suspicious_hashes: screening.suspicious_hashes,
        agent1_cost: screening.cost,
        agent2_cost: forensic.cost,
        agent3_cost: null,
        benchmark_cost: totalBenchmarkCost,
        actual_cost: totalActualCost,
        saved: totalBenchmarkCost - totalActualCost,
        escalated_to_agent2: true,
        escalated_to_agent3: false,
      };

      await persistScan(contractAddress, resolvedChain, scanResult);
      const memoryContext = formatMemoryContextWithCurrent(memory, scanResult.risk_score);
      return NextResponse.json({ ...scanResult, memory: memoryContext });
    }

    // AGENT 3: Final verdict
    const verdict = await agent3Judge(
      contractAddress,
      resolvedChain,
      screening.flags,
      forensic.findings,
      forensic.wallet_risk
    );
    totalActualCost += verdict.cost;
    totalBenchmarkCost += verdict.benchmarkCost;

    const scanResult = {
      verdict: verdict.verdict,
      risk_score: verdict.rug_probability,
      flags: [...screening.flags, ...forensic.findings],
      summary: verdict.summary,
      action: verdict.action,
      key_evidence: verdict.key_evidence,
      suspicious_hashes: screening.suspicious_hashes,
      agent1_cost: screening.cost,
      agent2_cost: forensic.cost,
      agent3_cost: verdict.cost,
      benchmark_cost: totalBenchmarkCost,
      actual_cost: totalActualCost,
      saved: totalBenchmarkCost - totalActualCost,
      escalated_to_agent2: true,
      escalated_to_agent3: true,
    };

    await persistScan(contractAddress, resolvedChain, scanResult);
    const memoryContext = formatMemoryContextWithCurrent(memory, scanResult.risk_score);
    return NextResponse.json({ ...scanResult, memory: memoryContext });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      {
        error: 'Scan failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Save the scan to persistent memory. Failures are logged, never thrown —
// a Supabase outage must not take down the scan response.
async function persistScan(
  contractAddress: string,
  chain: string,
  scanResult: {
    verdict: 'SAFE' | 'RISKY' | 'TRAP';
    risk_score: number;
    flags: string[];
    summary: string;
    key_evidence: string[];
    agent1_cost: number;
    agent2_cost: number | null;
    agent3_cost: number | null;
    benchmark_cost: number;
    actual_cost: number;
    saved: number;
    escalated_to_agent2: boolean;
    escalated_to_agent3: boolean;
    suspicious_hashes?: string[];
  }
): Promise<void> {
  const record: ScanRecord = {
    contract_address: contractAddress.toLowerCase(),
    chain,
    verdict: scanResult.verdict,
    risk_score: scanResult.risk_score,
    summary: scanResult.summary,
    flags: scanResult.flags,
    key_evidence: scanResult.key_evidence,
    actual_cost: scanResult.actual_cost,
    benchmark_cost: scanResult.benchmark_cost,
    saved: scanResult.saved,
    escalated_to_agent2: scanResult.escalated_to_agent2,
    escalated_to_agent3: scanResult.escalated_to_agent3,
  };

  try {
    await saveScan(record);
  } catch (error) {
    console.error('Failed to persist scan:', error);
  }
}

// Mock transactions for demo mode
function getMockTransactions(): Transaction[] {
  return [
    { hash: '0x4a2f8c91d3e7b516f', amount: '0.42 ETH', wallet: '0xabc...123', timestamp: Date.now() - 60000 },
    { hash: '0x9b1e3d7742fc8a21e', amount: '1.2 ETH', wallet: '0xdef...456', timestamp: Date.now() - 45000 },
    { hash: '0x2c8af14299d3b7c5f', amount: '0.08 ETH', wallet: '0xghi...789', timestamp: Date.now() - 30000 },
    { hash: '0x7f3ba509ec12d84f1', amount: '18.4 ETH', wallet: '0xDEV...WALLET', timestamp: Date.now() - 15000 },
    { hash: '0x1d6c8e2453af9b71c', amount: '2.1 ETH', wallet: '0xjkl...012', timestamp: Date.now() - 5000 },
  ];
}
