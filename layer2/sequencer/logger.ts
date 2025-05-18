import fs from 'fs';

type LogEntry = {
  nodeId?: string;
  batchId: number;
  timestamp: string;
  transactionCount: number;
  gasPerTx: string;
  cumulativeGas: string;
  merkleRoot: string;
  finalState: number;
};

function appendBatchLog(entry: LogEntry, filePath: string) {
  const line = JSON.stringify(entry);
  fs.appendFileSync(filePath, line + '\n', 'utf-8');
}

export { appendBatchLog };
