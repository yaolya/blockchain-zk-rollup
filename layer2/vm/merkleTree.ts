import { keccak256, toUtf8Bytes } from 'ethers';

type Transaction = {
  op: string;
  key: string;
  value: number;
};

function hashLeaf(tx: Transaction) {
  let tx_stringified = '';
  if (typeof tx !== 'string') {
    tx_stringified = JSON.stringify(tx);
  }
  return keccak256(toUtf8Bytes(tx_stringified));
}

function hashPair(a: string, b: string) {
  const sorted = [a, b].sort();
  return keccak256(
    Buffer.concat([
      Buffer.from(sorted[0].slice(2), 'hex'),
      Buffer.from(sorted[1].slice(2), 'hex'),
    ]),
  );
}

function buildMerkleRoot(transactions: Transaction[]) {
  if (transactions.length === 0) {
    throw new Error('No transactions to build a Merkle tree');
  }

  // Hash all leaves
  let hashes = transactions.map((tx) => hashLeaf(tx));

  // Build tree upwards
  while (hashes.length > 1) {
    const temp = [];

    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 === hashes.length) {
        // If odd number, duplicate the last one
        temp.push(hashes[i]);
      } else {
        temp.push(hashPair(hashes[i], hashes[i + 1]));
      }
    }

    hashes = temp; // Move up one level
  }

  // Return root
  return hashes[0];
}

export { buildMerkleRoot };
