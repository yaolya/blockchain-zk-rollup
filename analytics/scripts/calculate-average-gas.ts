import fs from 'fs';
import path from 'path';

const logsDir = path.resolve(__dirname, '..', 'logs');

function collectGasStats(): { gasPerTxValues: bigint[] } {
  const nodeDirs = fs
    .readdirSync(logsDir)
    .filter((f) => fs.statSync(path.join(logsDir, f)).isDirectory());

  const gasPerTxValues: bigint[] = [];

  for (const nodeDir of nodeDirs) {
    const logPath = path.join(logsDir, nodeDir, 'batchLog.json');
    if (!fs.existsSync(logPath)) continue;

    const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    for (const entry of entries) {
      if (entry.gasPerTx) {
        gasPerTxValues.push(BigInt(entry.gasPerTx));
      }
    }
  }

  return { gasPerTxValues };
}

function computeAverageGas(gasPerTxValues: bigint[]): number {
  if (gasPerTxValues.length === 0) return 0;

  const total = gasPerTxValues.reduce((sum, val) => sum + val, 0n);
  const avg = total / BigInt(gasPerTxValues.length);

  return Number(avg);
}

function main() {
  const { gasPerTxValues } = collectGasStats();
  const avgGasPerTx = computeAverageGas(gasPerTxValues);

  console.log('Total batches:', gasPerTxValues.length);
  console.log('Average gas per transaction:', avgGasPerTx.toFixed(2));
}

main();
