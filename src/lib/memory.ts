// src/lib/memory.ts
// Simulates RetainDB persistent memory using Supabase
// Swap this file's internals for RetainDB SDK if BTL grants access

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Created lazily (not at module load) so importing this file never throws
// during Next.js build-time page-data collection when env vars aren't set.
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return supabase;
}

export interface ScanRecord {
  contract_address: string;
  chain: string;
  verdict: 'SAFE' | 'RISKY' | 'TRAP';
  risk_score: number;
  summary: string;
  flags: string[];
  key_evidence: string[];
  actual_cost: number;
  benchmark_cost: number;
  saved: number;
  escalated_to_agent2: boolean;
  escalated_to_agent3: boolean;
  scanned_at?: string;
}

export interface ScanMemory {
  previousScans: ScanRecord[];
  riskTrend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'NEW';
  riskDelta: number;
  firstSeen: string | null;
  totalScans: number;
  previousVerdict: string | null;
  previousRisk: number | null;
}

// Save a scan result to persistent memory
export async function saveScan(scan: ScanRecord): Promise<void> {
  const { error } = await getSupabase()
    .from('scan_history')
    .insert([scan]);

  if (error) {
    console.error('Failed to save scan:', error);
  }
}

// Retrieve memory for a contract address
// This is the RetainDB simulation — persistent recall across sessions
export async function getMemory(contractAddress: string): Promise<ScanMemory> {
  // Get all previous scans for this contract
  const { data: scans, error } = await getSupabase()
    .from('scan_history')
    .select('*')
    .eq('contract_address', contractAddress.toLowerCase())
    .order('scanned_at', { ascending: false })
    .limit(10);

  if (error || !scans || scans.length === 0) {
    return {
      previousScans: [],
      riskTrend: 'NEW',
      riskDelta: 0,
      firstSeen: null,
      totalScans: 0,
      previousVerdict: null,
      previousRisk: null,
    };
  }

  const latest = scans[0];
  const previous = scans[1];

  // Calculate risk trend
  let riskTrend: ScanMemory['riskTrend'] = 'STABLE';
  let riskDelta = 0;

  if (previous) {
    riskDelta = latest.risk_score - previous.risk_score;
    if (riskDelta > 10) riskTrend = 'INCREASING';
    else if (riskDelta < -10) riskTrend = 'DECREASING';
    else riskTrend = 'STABLE';
  } else {
    riskTrend = 'NEW';
  }

  return {
    previousScans: scans,
    riskTrend,
    riskDelta,
    firstSeen: scans[scans.length - 1]?.scanned_at || null,
    totalScans: scans.length,
    previousVerdict: previous?.verdict || null,
    previousRisk: previous?.risk_score || null,
  };
}

// Format memory context for display in UI
export function formatMemoryContext(memory: ScanMemory): string | null {
  if (memory.riskTrend === 'NEW') return null;

  const daysSince = memory.firstSeen
    ? Math.floor((Date.now() - new Date(memory.firstSeen).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (memory.riskTrend === 'INCREASING') {
    return `⚠️ Risk increased by ${memory.riskDelta}% since last scan ${daysSince > 0 ? `${daysSince} days ago` : 'earlier'}. Previously: ${memory.previousVerdict} at ${memory.previousRisk}%.`;
  }

  if (memory.riskTrend === 'DECREASING') {
    return `✅ Risk decreased by ${Math.abs(memory.riskDelta)}% since last scan. Previously: ${memory.previousVerdict} at ${memory.previousRisk}%.`;
  }

  return `Previously scanned ${memory.totalScans} time${memory.totalScans > 1 ? 's' : ''}. Last verdict: ${memory.previousVerdict} at ${memory.previousRisk}% risk.`;
}
