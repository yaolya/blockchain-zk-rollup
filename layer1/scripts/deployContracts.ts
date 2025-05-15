import fs from 'fs';
import path from 'path';

import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const DPoSManager = await ethers.getContractFactory('DPoSManager');
  const dposManager = await DPoSManager.deploy();
  await dposManager.waitForDeployment();
  console.log('DPoSManager deployed to:', dposManager.target);

  // Register & vote for deployer as active sequencer (public address only)
  const tx1 = await dposManager.registerCandidate();
  await tx1.wait();
  const tx2 = await dposManager.delegate(deployer.address);
  await tx2.wait();
  console.log('Deployer registered and voted as active sequencer.');

  const SequencerRegistry =
    await ethers.getContractFactory('SequencerRegistry');
  const sequencerRegistry = await SequencerRegistry.deploy(dposManager.target);
  await sequencerRegistry.waitForDeployment();
  console.log('SequencerRegistry deployed to:', sequencerRegistry.target);

  const Verifier = await ethers.getContractFactory('BatchProofGroth16Verifier');
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log('Verifier deployed to:', verifier.target);

  const RollupManager = await ethers.getContractFactory('RollupManager');
  const rollupManager = await RollupManager.deploy(
    sequencerRegistry.target,
    verifier.target,
  );
  await rollupManager.waitForDeployment();
  console.log('RollupManager deployed to:', rollupManager.target);

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
  console.error('[❌] Deployment error:', error);
  process.exitCode = 1;
});
