import { applyTransactions } from '../vm/vm';
import { buildMerkleRoot } from '../vm/merkleTree';
import { appendBatchLog } from './logger';
import { submitToL1 } from '../coordinator/submitToL1';

import fs from 'fs';
import path from 'path';

type Transaction = {
  op: string;
  key: string;
  value: number;
};

const BATCH_SIZE_LIMIT = 5;
const BATCH_INTERVAL_MS = 60_000;
const MAX_ESTIMATED_GAS_PER_BATCH = 500_000;

const pendingTxs: Transaction[] = [];
let state = 0;

let batchCounter = 0;
let totalEstimatedGasUsed = 0;

const baseLogDir = path.resolve(process.cwd(), 'analytics', 'logs');

const logFilePath = path.join(baseLogDir, 'batchLog.json');
const archiveDir = path.join(baseLogDir, 'archive');

if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

if (fs.existsSync(logFilePath)) {
  const content = fs.readFileSync(logFilePath, 'utf-8').trim();
  if (content && content !== '[]') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(archiveDir, `batchLog-${timestamp}.json`);
    try {
      fs.renameSync(logFilePath, archivePath);
      console.log(`Archived old batchLog.json to ${archivePath}`);
    } catch (err) {
      console.warn(`[⚠️] Failed to archive batchLog.json:`, err);
    }
  } else {
    console.log('[⚠️] No meaningful data to archive');
  }
  fs.writeFileSync(logFilePath, '[]');
  console.log('Cleaned batchLog.json for new session');
}

function receiveTransaction(tx: Transaction) {
  pendingTxs.push(tx);

  const estimatedGas = estimateBatchGas(pendingTxs.length);

  if (
    pendingTxs.length >= BATCH_SIZE_LIMIT ||
    estimatedGas >= MAX_ESTIMATED_GAS_PER_BATCH
  ) {
    console.log('[*] Threshold reached. Executing batch...');
    executeBatch();
  }
}

setInterval(() => {
  if (pendingTxs.length > 0) {
    console.log('[*] Timer triggered batch execution...');
    executeBatch();
  }
}, BATCH_INTERVAL_MS);

async function executeBatch() {
  if (pendingTxs.length === 0) {
    console.log('[*] No transactions to execute.');
    return null;
  }

  const batchTxs = pendingTxs.splice(0, BATCH_SIZE_LIMIT);
  const timestamp = new Date().toISOString();
  batchCounter++;

  const estimatedGas = estimateBatchGas(batchTxs.length);
  totalEstimatedGasUsed += estimatedGas;

  const previousStateValue = state;
  state = applyTransactions(state, batchTxs);
  const currentStateValue = state;
  const root = buildMerkleRoot(batchTxs);

  await submitToL1({
    initialState: previousStateValue,
    finalState: currentStateValue,
    txs: batchTxs.map((tx) => tx.value),
    merkleRoot: root,
  });

  const logEntry = {
    batchId: batchCounter,
    timestamp,
    transactionCount: batchTxs.length,
    estimatedGas,
    cumulativeGas: totalEstimatedGasUsed,
    merkleRoot: root,
    finalState: state,
  };

  console.log(`Batch #${batchCounter} executed at ${timestamp}`);
  console.log(`Logging batch to batchLog.json`);
  appendBatchLog(logEntry);

  return root;
}

function estimateBatchGas(numTxs: number) {
  const gasPerTx = 21_000;
  return numTxs * gasPerTx;
}

export { receiveTransaction, executeBatch };
