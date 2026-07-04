export type Chain = 'EVM' | 'SOL';

export interface Transaction {
  hash: string;
  amount: string;
  wallet: string;
  timestamp: number;
  chain: Chain;
}
