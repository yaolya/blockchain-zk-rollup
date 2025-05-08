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

  const RollupManagerAbi = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), '../shared', 'RollupManager.abi.json'),
      'utf-8',
    ),
  );

  const rollupManager = new ethers.Contract(
    deployed.RollupManager,
    RollupManagerAbi,
    signer,
  );

  const circuit = await zkit.getCircuit('BatchProof');

  const inputs = {
    initialState,
    finalState,
    txs,
  };

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

export { submitToL1 };
