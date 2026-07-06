// src/app/api/scan/mock/route.ts
// Demo-mode scan endpoint. Completely separate from the real pipeline in
// src/app/api/scan/route.ts — no BTL API calls, no Supabase writes — so
// ?demo=true can never accidentally spend real credentials or touch the
// real database.

import { NextRequest, NextResponse } from 'next/server';
import mockFeedData from '@/data/mock-feed.json';

interface MockFeedEntry {
  hash: string;
  flagged?: boolean;
}

const PLANTED_HASH = (mockFeedData as MockFeedEntry[]).find((tx) => tx.flagged)?.hash;

const CLEAN_RESPONSE = {
  verdict: 'SAFE' as const,
  risk_score: 4,
  flags: [] as string[],
  summary: 'All transactions appear normal. No suspicious patterns detected.',
  action: 'No immediate action required.',
  key_evidence: [] as string[],
  benchmark_cost: 0.02,
  actual_cost: 0.0002,
  saved: 0.0198,
  escalated_to_agent2: false,
  escalated_to_agent3: false,
  memory: null,
};

const TRAP_RESPONSE = {
  verdict: 'TRAP' as const,
  risk_score: 91,
  flags: [
    'Dev wallet moved 41% of supply',
    'Liquidity dropped 34% in 6 minutes',
    'Deployer wallet linked to 4 prior rug pulls',
    'Unlimited token approvals detected',
  ],
  summary:
    'Dev wallet controlling 41% of supply moved tokens to a 3-day-old address. Liquidity dropped 34% in the last 6 minutes. This wallet has been linked to 4 prior rug pulls.',
  action: 'Do not buy. If holding, exit immediately.',
  key_evidence: [
    'Dev wallet moved 41% of supply to a fresh address',
    'Liquidity pool drained 34% within 6 minutes',
    'Deployer wallet matches 4 prior rug pull signatures',
  ],
  benchmark_cost: 0.06,
  actual_cost: 0.0028,
  saved: 0.0572,
  escalated_to_agent2: true,
  escalated_to_agent3: true,
  memory: null,
};

export async function POST(request: NextRequest) {
  const { transactions } = await request.json();
  const batch = Array.isArray(transactions) ? transactions : (transactions ? [transactions] : []);
  const isPlanted = batch.some((tx: { hash?: string }) => Boolean(tx?.hash) && tx.hash === PLANTED_HASH);

  if (!isPlanted) {
    return NextResponse.json(CLEAN_RESPONSE);
  }

  // Simulate the real cascade's Agent 2 + Agent 3 processing time.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return NextResponse.json(TRAP_RESPONSE);
}
