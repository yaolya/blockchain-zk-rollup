import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('hardhat_test_accounts.json', 'utf-8'));
const firstKey = data[0].privateKey;

const keyPath = path.join(process.cwd(), '../shared', 'sequencer.key');
fs.writeFileSync(keyPath, firstKey);
console.log('sequencer.key written to shared/');
