import 'dotenv/config';
import fs from 'fs';
import path from 'path';

import { ContractTransactionResponse, ethers } from 'ethers';
import { zkit } from 'hardhat';

type SubmitInput = {
  initialState: number;
  finalState: number;
  txs: number[];
  merkleRoot: string;
};

async function submitToL1({
  initialState,
  finalState,
  txs,
  merkleRoot,
}: SubmitInput) {
  const privateKey = process.env.SEQUENCER_PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;

  if (!privateKey || !rpcUrl) {
    throw new Error(
      'Missing SEQUENCER_PRIVATE_KEY or RPC_URL in environment variables.',
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const deployed = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), '../shared', 'deployed.json'),
      'utf-8',
    ),
  );

  const abi = [
    'function submitBatch(uint256[2], uint256[2][2], uint256[2], uint256[1], bytes32)',
  ];

  const rollupManager = new ethers.Contract(
    deployed.RollupManager,
    abi,
    signer,
  );

  const circuit = await zkit.getCircuit('BatchProof');

  const inputs = {
    initialState,
    finalState,
    txs,
  };

  const isActive = await isActiveSequencer(signer);
  if (!isActive) {
    console.log(
      `[${process.env.NODE_ID}] Not the active sequencer. Skipping batch.`,
    );
    return;
  }

  const proof = await circuit.generateProof(inputs);
  const calldata = await circuit.generateCalldata(proof);
  console.log(calldata.publicSignals);
  let tx: ContractTransactionResponse;
  if (
    'a' in calldata.proofPoints &&
    'b' in calldata.proofPoints &&
    'c' in calldata.proofPoints
  ) {
    tx = await rollupManager.submitBatch(
      calldata.proofPoints.a,
      calldata.proofPoints.b,
      calldata.proofPoints.c,
      calldata.publicSignals,
      merkleRoot,
    );
  } else {
    throw new Error('Unsupported proof format: expected Groth16');
  }

  console.log('Batch submitted to RollupManager!');
  console.log('Tx Hash:', tx.hash);

  await tx.wait();
}

async function isActiveSequencer(signer: ethers.Wallet): Promise<boolean> {
  const dposManagerAddress = process.env.DPOS_MANAGER_ADDRESS;
  if (!dposManagerAddress) throw new Error('DPOS_MANAGER_ADDRESS not set');

  const abi = ['function getActiveSequencer() view returns (address)'];
  const contract = new ethers.Contract(
    dposManagerAddress,
    abi,
    signer.provider,
  );
  const active = await contract.getActiveSequencer();
  return active.toLowerCase() === signer.address.toLowerCase();
}

export { submitToL1 };
