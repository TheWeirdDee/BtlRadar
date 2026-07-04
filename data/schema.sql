-- BTL Radar — Supabase Schema
-- Simulates RetainDB persistent memory layer
-- Run this in your Supabase SQL editor before July 3rd

-- Scan history table
CREATE TABLE scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'EVM',
  verdict TEXT NOT NULL, -- SAFE / RISKY / TRAP
  risk_score INTEGER NOT NULL,
  summary TEXT,
  flags TEXT[], -- array of flag strings
  key_evidence TEXT[],
  agent1_cost DECIMAL(10, 6),
  agent2_cost DECIMAL(10, 6),
  agent3_cost DECIMAL(10, 6),
  actual_cost DECIMAL(10, 6),
  benchmark_cost DECIMAL(10, 6),
  saved DECIMAL(10, 6),
  escalated_to_agent2 BOOLEAN DEFAULT false,
  escalated_to_agent3 BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by contract address
CREATE INDEX idx_contract_address ON scan_history(contract_address);
CREATE INDEX idx_scanned_at ON scan_history(scanned_at DESC);

-- View: latest scan per contract
CREATE VIEW latest_scans AS
SELECT DISTINCT ON (contract_address)
  *
FROM scan_history
ORDER BY contract_address, scanned_at DESC;

-- View: risk trend per contract (for "risk increased" feature)
CREATE VIEW risk_trends AS
SELECT
  contract_address,
  chain,
  COUNT(*) as total_scans,
  MIN(risk_score) as lowest_risk,
  MAX(risk_score) as highest_risk,
  (array_agg(risk_score ORDER BY scanned_at DESC))[1] as latest_risk,
  (array_agg(risk_score ORDER BY scanned_at DESC))[2] as previous_risk,
  (array_agg(verdict ORDER BY scanned_at DESC))[1] as latest_verdict,
  MIN(scanned_at) as first_scanned,
  MAX(scanned_at) as last_scanned
FROM scan_history
GROUP BY contract_address, chain;
