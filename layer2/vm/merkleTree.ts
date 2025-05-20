import { Poseidon } from '@iden3/js-crypto';

type Transaction = {
  op: string;
  key: string;
  value: number;
};

function hashLeaf(tx: Transaction, index: number): bigint {
  return Poseidon.hash([BigInt(tx.value), BigInt(index)]);
}

function hashPair(a: bigint, b: bigint): bigint {
  return Poseidon.hash([a, b]);
}

function buildMerkleRoot(txs: Transaction[]): bigint {
  let hashes = txs.map((tx, i) => hashLeaf(tx, i));

  while (hashes.length > 1) {
    const temp: bigint[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left;
      temp.push(hashPair(left, right));
    }
    hashes = temp;
  }

  return hashes[0];
}

export { buildMerkleRoot };
