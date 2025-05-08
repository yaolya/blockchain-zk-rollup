import fs from 'fs';
import path from 'path';

const deployedPath = path.join(process.cwd(), '../shared', 'deployed.json');
const templatePath = path.resolve(__dirname, '../.env.template');
const envPath = path.resolve(__dirname, '../.env');

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

async function waitForDeployedJson() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (fs.existsSync(deployedPath)) {
      try {
        const content = fs.readFileSync(deployedPath, 'utf-8');
        const deployed = JSON.parse(content);
        if (deployed.RollupManager) {
          return deployed;
        }
      } catch {
        console.log(
          `⏳ deployed.json not ready (attempt ${i + 1}). Retrying...`,
        );
      }
    } else {
      console.log(`⏳ deployed.json not found (attempt ${i + 1}). Retrying...`);
    }
    await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
  }
  throw new Error('[❌] deployed.json not ready after multiple retries.');
}

async function main() {
  console.log('[*] Waiting for deployed.json...');
  const deployed = await waitForDeployedJson();
  console.log('deployed.json loaded!');

  const keyPath = path.join(process.cwd(), '../shared', 'sequencer.key');
  const privateKey = fs.readFileSync(keyPath, 'utf-8').trim();

  const template = fs
    .readFileSync(templatePath, 'utf-8')
    .replace('{{ROLLUP_MANAGER_ADDRESS}}', deployed.RollupManager)
    .replace('{{SEQUENCER_PRIVATE_KEY}}', privateKey);

  fs.writeFileSync(envPath, template);

  console.log('.env file generated successfully!');
}

main().catch((error) => {
  console.error('[❌] Error generating .env:', error);
  process.exit(1);
});
