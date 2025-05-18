import fs from 'fs';
import path from 'path';

const logsDir = path.resolve(__dirname, '..', 'logs');

function parseTimestamp(ts: string): number {
  return new Date(ts).getTime();
}

function collectLogs(): { timestamps: number[]; totalTxs: number } {
  const nodeDirs = fs
    .readdirSync(logsDir)
    .filter((f) => fs.statSync(path.join(logsDir, f)).isDirectory());

  const allTimestamps: number[] = [];
  let totalTxs = 0;

  for (const nodeDir of nodeDirs) {
    const logPath = path.join(logsDir, nodeDir, 'batchLog.json');
    if (!fs.existsSync(logPath)) continue;

    const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    for (const entry of entries) {
      allTimestamps.push(parseTimestamp(entry.timestamp));
      totalTxs += entry.transactionCount;
    }
  }

  return { timestamps: allTimestamps, totalTxs };
}

function computeTPS(timestamps: number[], totalTxs: number): number {
  if (timestamps.length < 2) return 0;

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const durationSec = (max - min) / 1000;

  return durationSec > 0 ? totalTxs / durationSec : 0;
}

function main() {
  const { timestamps, totalTxs } = collectLogs();
  const tps = computeTPS(timestamps, totalTxs);

  console.log('Total transactions:', totalTxs);
  console.log(
    'Time span:',
    (Math.max(...timestamps) - Math.min(...timestamps)) / 1000,
    'seconds',
  );
  console.log('TPS:', tps.toFixed(2));
}

main();
