import fs from 'fs';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'analytics', 'logs');
const logFile = path.join(logDir, 'batchLog.json');

type LogEntry = {
  batchId: number;
  timestamp: string;
  transactionCount: number;
  estimatedGas: number;
  cumulativeGas: number;
  merkleRoot: string;
  finalState: number;
};

function appendBatchLog(entry: LogEntry) {
  let logs = [];
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    } catch {
      console.error('[⚠️] Failed to parse existing batchLog.json');
    }
  }
  logs.push(entry);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

export { appendBatchLog };
