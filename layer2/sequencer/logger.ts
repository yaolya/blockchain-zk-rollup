import fs from 'fs';

type LogEntry = {
  nodeId?: string;
  batchId: number;
  timestamp: string;
  transactionCount: number;
  estimatedGas: number;
  cumulativeGas: number;
  merkleRoot: string;
  finalState: number;
};

function appendBatchLog(entry: LogEntry, filePath: string) {
  let logs = [];
  if (fs.existsSync(filePath)) {
    try {
      logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      console.error(`Failed to parse existing ${filePath}`);
    }
  }

  logs.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
}

export { appendBatchLog };
