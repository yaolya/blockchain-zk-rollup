import fs from 'fs';
import path from 'path';

import { ethers } from 'hardhat';

import { appendBatchLog } from './logger';
import { submitToL1 } from '../coordinator/submitToL1';
import { buildMerkleRoot } from '../vm/merkleTree';
import { applyTransactions } from '../vm/vm';

type Transaction = {
  op: string;
  key: string;
  value: number;
};

const nodeId = process.env.NODE_ID || 'default-node';

const BATCH_SIZE_LIMIT = 5;
const BATCH_INTERVAL_MS = 60_000;
const MAX_ESTIMATED_GAS_PER_BATCH = 500_000;

const pendingTxs: Transaction[] = [];
let state = 0;

let batchCounter = 0;
let totalEstimatedGasUsed = 0;

const baseLogDir = path.resolve(process.cwd(), 'analytics', 'logs', nodeId);
const logFilePath = path.join(baseLogDir, 'batchLog.json');
const archiveDir = path.join(baseLogDir, 'archive');

if (!fs.existsSync(baseLogDir)) {
  fs.mkdirSync(baseLogDir, { recursive: true });
}

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
      console.log(`[${nodeId}] Archived old batchLog.json to ${archivePath}`);
    } catch (err) {
      console.warn(`[${nodeId}] Failed to archive batchLog.json:`, err);
    }
  } else {
    console.log(`[${nodeId}] No meaningful data to archive`);
  }
  fs.writeFileSync(logFilePath, '[]');
  console.log(`[${nodeId}] Cleaned batchLog.json for new session`);
}

async function registerAndVote() {
  const privateKey = process.env.SEQUENCER_PRIVATE_KEY!;
  const rpcUrl = process.env.RPC_URL!;
  const dposManagerAddress = process.env.DPOS_MANAGER_ADDRESS!;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const code = await provider.getCode(dposManagerAddress);
  if (code === '0x') {
    throw new Error(`[${nodeId}] No contract at ${dposManagerAddress}`);
  }

  const abi = [
    'function registerCandidate() public',
    'function delegate(address candidate) public',
  ];

  const dpos = new ethers.Contract(dposManagerAddress, abi, signer);

  try {
    const tx1 = await dpos.registerCandidate();
    await tx1.wait();
    console.log(`[${nodeId}] Registered as candidate.`);
  } catch {
    console.log(`[${nodeId}] Already registered as candidate.`);
  }

  const tx2 = await dpos.delegate(signer.address);
  await tx2.wait();
  console.log(`[${nodeId}] Voted for self.`);
}

async function main() {
  await registerAndVote();
}

main().catch((err) => {
  console.error(`[${nodeId}] DPoS init failed:`, err);
});

function receiveTransaction(tx: Transaction) {
  pendingTxs.push(tx);

  const estimatedGas = estimateBatchGas(pendingTxs.length);

  if (
    pendingTxs.length >= BATCH_SIZE_LIMIT ||
    estimatedGas >= MAX_ESTIMATED_GAS_PER_BATCH
  ) {
    console.log(`[${nodeId}] Threshold reached. Executing batch...`);
    executeBatch();
  }
}

setInterval(() => {
  if (pendingTxs.length > 0) {
    console.log(`[${nodeId}] Timer triggered batch execution...`);
    executeBatch();
  }
}, BATCH_INTERVAL_MS);

async function executeBatch() {
  if (pendingTxs.length === 0) {
    console.log(`[${nodeId}] No transactions to execute.`);
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
    nodeId,
    batchId: batchCounter,
    timestamp,
    transactionCount: batchTxs.length,
    estimatedGas,
    cumulativeGas: totalEstimatedGasUsed,
    merkleRoot: root,
    finalState: state,
  };

  console.log(`[${nodeId}] Batch #${batchCounter} executed at ${timestamp}`);
  console.log(`[${nodeId}] Logging batch to ${logFilePath}`);
  appendBatchLog(logEntry, logFilePath);

  return root;
}

function estimateBatchGas(numTxs: number) {
  const gasPerTx = 21_000;
  return numTxs * gasPerTx;
}

export { receiveTransaction, executeBatch };
