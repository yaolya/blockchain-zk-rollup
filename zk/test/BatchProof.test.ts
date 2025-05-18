import { expect } from 'chai';
import { zkit } from 'hardhat';

describe('BatchProof', () => {
  it('should compute final state from initial state and txs', async () => {
    const circuit = await zkit.getCircuit('BatchProof');

    const BATCH_SIZE = 20;
    const initialState = 10n;
    const txs = Array.from({ length: BATCH_SIZE }, () =>
      BigInt(Math.floor(Math.random() * 10) + 1),
    );

    const finalState = txs.reduce((sum, tx) => sum + tx, initialState);

    await expect(circuit)
      .with.witnessInputs({
        initialState,
        finalState,
        txs,
      })
      .to.have.witnessOutputs({ result: finalState });
  });
});
