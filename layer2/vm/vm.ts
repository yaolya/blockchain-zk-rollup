type Transaction = {
  op: string;
  key: string;
  value: number;
};

function applyTransactions(state: number, txs: Transaction[]) {
  for (const tx of txs) {
    state = state + tx.value;
  }
  return state;
}

export { applyTransactions };
