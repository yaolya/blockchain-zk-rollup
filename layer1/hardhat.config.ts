import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import '@solarity/hardhat-zkit';
import '@solarity/chai-zkit';
import '@nomicfoundation/hardhat-ethers';

import fs from 'fs';

import { HardhatUserConfig } from 'hardhat/config';

const accounts: string[] = JSON.parse(
  fs.readFileSync('./hardhat_test_accounts.json', 'utf-8'),
).map((a: { privateKey: string }) => a.privateKey);

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: accounts,
    },
  },
};

export default config;
