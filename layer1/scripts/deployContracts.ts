import fs from 'fs';
import path from 'path';

import { ethers } from 'hardhat';

async function waitForContractCode(address: string) {
  const maxTries = 30;
  const interval = 1000;
  for (let i = 0; i < maxTries; i++) {
    const code = await ethers.provider.getCode(address);
    if (code !== '0x') {
      console.log(`Contract code found at ${address}`);
      return;
    }
    console.log(`Waiting for contract code at ${address}...`);
    await new Promise((res) => setTimeout(res, interval));
  }
  throw new Error(`Timed out waiting for contract code at ${address}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const DPoSManager = await ethers.getContractFactory('DPoSManager');
  const dposManager = await DPoSManager.deploy();
  await dposManager.waitForDeployment();
  console.log('DPoSManager deployed to:', dposManager.target);
  await waitForContractCode(await dposManager.getAddress());

  const candidate = await dposManager.candidates(deployer.address);
  if (!candidate.registered) {
    const tx1 = await dposManager.registerCandidate();
    await tx1.wait();
    console.log(`[deployer] Registered as candidate.`);
  } else {
    console.log(`[deployer] Already registered as candidate.`);
  }
  const tx2 = await dposManager.delegate(deployer.address);
  await tx2.wait();
  console.log('Deployer registered and voted as active sequencer.');

  const SequencerRegistry =
    await ethers.getContractFactory('SequencerRegistry');
  const sequencerRegistry = await SequencerRegistry.deploy(dposManager.target);
  await sequencerRegistry.waitForDeployment();
  console.log('SequencerRegistry deployed to:', sequencerRegistry.target);
  await waitForContractCode(await sequencerRegistry.getAddress());

  const Verifier = await ethers.getContractFactory('BatchProofGroth16Verifier');
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log('Verifier deployed to:', verifier.target);
  await waitForContractCode(await verifier.getAddress());

  const RollupManager = await ethers.getContractFactory('RollupManager');
  const rollupManager = await RollupManager.deploy(
    sequencerRegistry.target,
    verifier.target,
  );
  await rollupManager.waitForDeployment();
  console.log('RollupManager deployed to:', rollupManager.target);
  await waitForContractCode(await rollupManager.getAddress());

  const output = {
    DPoSManager: dposManager.target,
    SequencerRegistry: sequencerRegistry.target,
    RollupManager: rollupManager.target,
  };

  const outputPath = path.join(process.cwd(), '../shared', 'deployed.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('Contract addresses written to shared/deployed.json');
}

main().catch((error) => {
  console.error('Deployment error:', error);
  process.exitCode = 1;
});
