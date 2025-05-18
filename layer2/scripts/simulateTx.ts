import { receiveTransaction } from '../sequencer/sequencer';

const TX_PER_INTERVAL = 10;
const INTERVAL_MS = 250;
const MAX_TOTAL_TX = 2000;

let sentTxs = 0;

console.log('[*] Simulated transaction emitter started...');

const interval = setInterval(() => {
  console.log(`Emitting ${TX_PER_INTERVAL} transactions...`);

  for (let i = 0; i < TX_PER_INTERVAL; i++) {
    const tx = {
      op: 'total',
      key: `key_${sentTxs + i}`,
      value: Math.floor(Math.random() * 100),
    };
    receiveTransaction(tx);
  }

  sentTxs += TX_PER_INTERVAL;

  if (sentTxs >= MAX_TOTAL_TX) {
    console.log('Simulation complete');
    clearInterval(interval);
  }
}, INTERVAL_MS);
