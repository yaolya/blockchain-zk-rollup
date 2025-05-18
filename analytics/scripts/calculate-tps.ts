import fs from 'fs';
import path from 'path';

const logsDir = path.resolve(__dirname, '..', 'logs');

function parseTimestamp(ts: string): number {
  return new Date(ts).getTime();
}

function collectLogs(): {
  timestamps: number[];
  totalTxs: number;
  gasPerTxValues: bigint[];
} {
  const nodeDirs = fs
    .readdirSync(logsDir)
    .filter((f) => fs.statSync(path.join(logsDir, f)).isDirectory());

  const timestamps: number[] = [];
  const gasPerTxValues: bigint[] = [];
  let totalTxs = 0;

  for (const nodeDir of nodeDirs) {
    const logPath = path.join(logsDir, nodeDir, 'batchLog.json');
    if (!fs.existsSync(logPath)) continue;

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (
          typeof entry.timestamp === 'string' &&
          typeof entry.transactionCount === 'number' &&
          typeof entry.gasPerTx === 'string'
        ) {
          timestamps.push(parseTimestamp(entry.timestamp));
          totalTxs += entry.transactionCount;
          gasPerTxValues.push(BigInt(entry.gasPerTx));
        }
      } catch {
        if (line != '') {
          console.warn(`Skipping invalid JSON line in ${logPath}:`, line);
        }
      }
    }
  }

  return { timestamps, totalTxs, gasPerTxValues };
}

function computeTPS(timestamps: number[], totalTxs: number): number {
  if (timestamps.length < 2) return 0;

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const durationSec = (max - min) / 1000;

  return durationSec > 0 ? totalTxs / durationSec : 0;
}

function computeAverageGas(gasPerTxValues: bigint[]): number {
  if (gasPerTxValues.length === 0) return 0;

  const total = gasPerTxValues.reduce((sum, val) => sum + val, 0n);
  return Number(total / BigInt(gasPerTxValues.length));
}

function main() {
  const { timestamps, totalTxs, gasPerTxValues } = collectLogs();

  if (timestamps.length === 0) {
    console.log('No valid log entries found.');
    return;
  }

  const tps = computeTPS(timestamps, totalTxs);
  const avgGas = computeAverageGas(gasPerTxValues);
  const timeSpanSec =
    (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;

  console.log('Total transactions:', totalTxs);
  console.log('Time span:', timeSpanSec.toFixed(2), 'seconds');
  console.log('TPS:', tps.toFixed(2));
  console.log('Average gas per transaction:', avgGas.toFixed(2));
}

main();
