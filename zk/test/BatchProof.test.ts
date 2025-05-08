import { zkit } from 'hardhat';
import { expect } from 'chai';

describe('BatchProof', () => {
  it('should compute final state from initial state and txs', async () => {
    const circuit = await zkit.getCircuit('BatchProof');

    const initialState = 10;
    const txs = [3, 4, 2, 3, 3];
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
