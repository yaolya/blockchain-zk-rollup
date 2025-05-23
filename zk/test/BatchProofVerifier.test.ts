import { expect } from 'chai';
import { ethers, zkit } from 'hardhat';

describe('BatchProofVerifier', function () {
  it('should verify a valid proof', async () => {
    const circuit = await zkit.getCircuit('BatchProof');

    const BATCH_SIZE = 20;
    const initialState = 10n;
    const txs = Array.from({ length: BATCH_SIZE }, () =>
      BigInt(Math.floor(Math.random() * 10) + 1),
    );
    const finalState = initialState + txs.reduce((a, b) => a + b, 0n);

    const inputs = { initialState, finalState, txs };
    const proof = await circuit.generateProof(inputs);
    const calldata = await circuit.generateCalldata(proof);

    const verifier = await ethers.deployContract('BatchProofGroth16Verifier');

    if (
      'a' in calldata.proofPoints &&
      'b' in calldata.proofPoints &&
      'c' in calldata.proofPoints
    ) {
      await expect(
        await verifier.verifyProof(
          calldata.proofPoints.a,
          calldata.proofPoints.b,
          calldata.proofPoints.c,
          [calldata.publicSignals[0]],
        ),
      ).to.be.true;
    } else {
      throw new Error('Unsupported proof format: expected Groth16');
    }
  });

  it('should reject an invalid proof', async () => {
    const circuit = await zkit.getCircuit('BatchProof');

    const BATCH_SIZE = 20;
    const initialState = 10n;
    const txs = Array.from({ length: BATCH_SIZE }, () =>
      BigInt(Math.floor(Math.random() * 10) + 1),
    );
    const finalState = initialState + txs.reduce((a, b) => a + b, 0n);

    const inputs = { initialState, finalState, txs };
    const proof = await circuit.generateProof(inputs);
    const calldata = await circuit.generateCalldata(proof);

    const verifier = await ethers.deployContract('BatchProofGroth16Verifier');
    const badSignals = [...calldata.publicSignals];
    badSignals[0] = (BigInt(badSignals[0]) + 1n).toString();
    const badSignalsAsStrings = badSignals.map((n) => n.toString());

    if (
      'a' in calldata.proofPoints &&
      'b' in calldata.proofPoints &&
      'c' in calldata.proofPoints
    ) {
      await expect(
        await verifier.verifyProof(
          calldata.proofPoints.a,
          calldata.proofPoints.b,
          calldata.proofPoints.c,
          [badSignalsAsStrings[0]],
        ),
      ).to.be.false;
    } else {
      throw new Error('Unsupported proof format: expected Groth16');
    }
  });
});
