'use client';

import { useState } from 'react';
import type { Chain } from '@/lib/types';

interface ContractInputProps {
  onScan: (address: string, chain: Chain) => void;
  scanning?: boolean;
  initialAddress?: string;
  initialChain?: Chain;
}

export default function ContractInput({ onScan, scanning, initialAddress = '', initialChain = 'EVM' }: ContractInputProps) {
  const [address, setAddress] = useState(initialAddress);
  const [chain, setChain] = useState<Chain>(initialChain);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    onScan(trimmed, chain);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-stretch gap-0 border border-border bg-surface font-mono">
      <div className="flex shrink-0">
        {(['EVM', 'SOL'] as Chain[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChain(c)}
            className={`px-4 text-sm tracking-wide transition-colors ${
              chain === c ? 'bg-text text-bg' : 'bg-surface text-muted hover:text-text'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Paste any contract address — EVM or Solana..."
        className="min-w-0 flex-1 border-x border-border bg-transparent px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={scanning}
        className="shrink-0 bg-mustard px-6 text-sm font-medium tracking-wide text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {scanning ? 'Scanning…' : 'Scan →'}
      </button>
    </form>
  );
}
