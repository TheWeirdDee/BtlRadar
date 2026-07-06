// src/lib/memory.ts
// Persistent scan memory — RetainDB v5 as primary, Supabase as fallback.
// RetainDB v5 API: new RetainDB({ apiKey }) then client.remember(content, { userId })
//                  and client.search(query, { userId }) or client.user(id).listMemory()

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { RetainDB } from '@retaindb/sdk';

// Lazy initialized clients
let supabase: SupabaseClient | null = null;
let retaindb: RetainDB | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return supabase;
}

function getRetainDB(): RetainDB | null {
  if (retaindb) return retaindb;
  // RETAINDB_API_KEY uses wsk_... format — do NOT fall back to BTL_API_KEY
  const apiKey = process.env.RETAINDB_API_KEY;
  if (!apiKey) return null;
  try {
    retaindb = new RetainDB({ apiKey });
    return retaindb;
  } catch (err) {
    console.warn('[memory] RetainDB init failed, using Supabase only:', err);
    return null;
  }
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
  const record: ScanRecord = {
    ...scan,
    scanned_at: scan.scanned_at || new Date().toISOString(),
  };

  // 1. RetainDB v5: remember(content, { userId })
  //    userId = contract address (lowercased) — scopes memory per contract
  const db = getRetainDB();
  if (db) {
    try {
      await db.remember(JSON.stringify(record), {
        userId: record.contract_address.toLowerCase(),
      });
      console.log('[memory] Saved scan to RetainDB');
    } catch (err) {
      console.error('[memory] RetainDB save failed:', err);
    }
  }

  // 2. Supabase — always write so we have a reliable fallback
  try {
    const { error } = await getSupabase().from('scan_history').insert([record]);
    if (error) console.error('[memory] Supabase save failed:', error);
    else console.log('[memory] Saved scan to Supabase');
  } catch (err) {
    console.error('[memory] Supabase save failed (catch):', err);
  }
}

// Retrieve memory for a contract address
export async function getMemory(contractAddress: string): Promise<ScanMemory> {
  const EMPTY: ScanMemory = {
    previousScans: [],
    riskTrend: 'NEW',
    riskDelta: 0,
    firstSeen: null,
    totalScans: 0,
    previousVerdict: null,
    previousRisk: null,
  };

  // 1. Try RetainDB v5
  const db = getRetainDB();
  if (db) {
    try {
      // v5: user(id).listMemory() returns memory items
      const items = await db.user(contractAddress.toLowerCase()).listMemory();
      if (items && items.length > 0) {
        const scans: ScanRecord[] = [];
        for (const item of items) {
          try {
            const content = typeof item === 'string' ? item : (item as { content?: string }).content ?? '';
            const parsed = JSON.parse(content) as ScanRecord;
            if (parsed?.contract_address) scans.push(parsed);
          } catch {
            // skip non-scan memory entries
          }
        }
        if (scans.length > 0) {
          return buildMemory(scans);
        }
      }
    } catch (err) {
      console.warn('[memory] RetainDB read failed, falling back to Supabase:', err);
    }
  }

  // 2. Supabase fallback
  try {
    const { data: scans, error } = await getSupabase()
      .from('scan_history')
      .select('*')
      .eq('contract_address', contractAddress.toLowerCase())
      .order('scanned_at', { ascending: false })
      .limit(10);

    if (error || !scans || scans.length === 0) return EMPTY;
    return buildMemory(scans as ScanRecord[]);
  } catch (err) {
    console.error('[memory] Supabase read failed:', err);
    return EMPTY;
  }
}

function buildMemory(scans: ScanRecord[]): ScanMemory {
  // Sort newest first
  const sorted = [...scans].sort((a, b) => {
    const ta = a.scanned_at ? new Date(a.scanned_at).getTime() : 0;
    const tb = b.scanned_at ? new Date(b.scanned_at).getTime() : 0;
    return tb - ta;
  });

  const latest = sorted[0];
  const previous = sorted[1];

  let riskTrend: ScanMemory['riskTrend'] = 'NEW';
  let riskDelta = 0;

  if (previous) {
    riskDelta = latest.risk_score - previous.risk_score;
    if (riskDelta > 10) riskTrend = 'INCREASING';
    else if (riskDelta < -10) riskTrend = 'DECREASING';
    else riskTrend = 'STABLE';
  }

  return {
    previousScans: sorted,
    riskTrend,
    riskDelta,
    firstSeen: sorted[sorted.length - 1]?.scanned_at ?? null,
    totalScans: sorted.length,
    previousVerdict: previous?.verdict ?? null,
    previousRisk: previous?.risk_score ?? null,
  };
}

// Format memory context string for display in the UI banner
export function formatMemoryContext(memory: ScanMemory): string | null {
  if (memory.riskTrend === 'NEW') return null;

  const daysSince = memory.firstSeen
    ? Math.floor((Date.now() - new Date(memory.firstSeen).getTime()) / 86_400_000)
    : 0;

  if (memory.riskTrend === 'INCREASING') {
    return `⚠️ Risk increased by ${memory.riskDelta}% since last scan ${daysSince > 0 ? `${daysSince}d ago` : 'earlier'}. Previously: ${memory.previousVerdict} at ${memory.previousRisk}%.`;
  }
  if (memory.riskTrend === 'DECREASING') {
    return `✅ Risk decreased by ${Math.abs(memory.riskDelta)}% since last scan. Previously: ${memory.previousVerdict} at ${memory.previousRisk}%.`;
  }
  return `Previously scanned ${memory.totalScans} time${memory.totalScans > 1 ? 's' : ''}. Last verdict: ${memory.previousVerdict} at ${memory.previousRisk}% risk.`;
}
