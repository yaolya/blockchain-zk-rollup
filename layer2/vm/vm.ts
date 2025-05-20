import { Poseidon } from '@iden3/js-crypto';

type Transaction = {
  op: string;
  key: string;
  value: number;
};

function applyTransactions(state: bigint, txs: Transaction[]): bigint {
  for (let i = 0; i < txs.length; i++) {
    const hash = Poseidon.hash([BigInt(txs[i].value), BigInt(i)]);
    state = state + hash;
  }
  return state;
}

export { applyTransactions };
