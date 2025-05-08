import { formatBytes32String } from '@ethersproject/strings';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, zkit } from 'hardhat';

import { RollupManager, MockSequencerRegistry } from '../typechain-types';

describe('RollupManager (with mock SequencerRegistry)', function () {
  let mockSequencerRegistry: MockSequencerRegistry,
    rollupManager: RollupManager;
  let sequencer: HardhatEthersSigner, other: HardhatEthersSigner;

  beforeEach(async function () {
    [sequencer, other] = await ethers.getSigners();

    const MockSequencerRegistry = await ethers.getContractFactory(
      'MockSequencerRegistry',
    );
    mockSequencerRegistry = await MockSequencerRegistry.deploy();
    await mockSequencerRegistry.waitForDeployment();

    const Verifier = await ethers.getContractFactory(
      'BatchProofGroth16Verifier',
    );
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    const RollupManager = await ethers.getContractFactory('RollupManager');
    rollupManager = await RollupManager.deploy(
      mockSequencerRegistry.target,
      verifier.target,
    );
    await rollupManager.waitForDeployment();
  });

  it('should deploy correctly with SequencerRegistry set', async function () {
    expect(await rollupManager.sequencerRegistry()).to.equal(
      mockSequencerRegistry.target,
    );
  });

  it('should allow authorized sequencer to submit a batch', async function () {
    const exampleRoot = formatBytes32String('example');

    await mockSequencerRegistry.setAuthorized(sequencer.address, true);

    const circuit = await zkit.getCircuit('BatchProof');

    const txs = [3n, 4n, 2n, 3n, 1n];
    const initialState = 10n;
    const finalState = initialState + txs.reduce((a, b) => a + b, 0n);

    const proof = await circuit.generateProof({
      initialState,
      finalState,
      txs,
    });
    const calldata = await circuit.generateCalldata(proof);

    if (
      'a' in calldata.proofPoints &&
      'b' in calldata.proofPoints &&
      'c' in calldata.proofPoints
    ) {
      await expect(
        rollupManager
          .connect(sequencer)
          .submitBatch(
            calldata.proofPoints.a,
            calldata.proofPoints.b,
            calldata.proofPoints.c,
            [calldata.publicSignals[0]],
            exampleRoot,
          ),
      )
        .to.emit(rollupManager, 'NewStateRoot')
        .withArgs(exampleRoot, 0);
    } else {
      throw new Error('Unsupported proof format: expected Groth16');
    }

    const latestRoot = await rollupManager.getLatestStateRoot();
    expect(latestRoot).to.equal(exampleRoot);
  });

  it('should not allow non-sequencer to submit a batch', async function () {
    const exampleRoot = formatBytes32String('unauthorized');
    await mockSequencerRegistry.setAuthorized(other.address, false);

    const circuit = await zkit.getCircuit('BatchProof');

    const txs = [3n, 4n, 2n, 3n, 1n];
    const initialState = 10n;
    const finalState = initialState + txs.reduce((a, b) => a + b, 0n);

    const proof = await circuit.generateProof({
      initialState,
      finalState,
      txs,
    });
    const calldata = await circuit.generateCalldata(proof);

    if (
      'a' in calldata.proofPoints &&
      'b' in calldata.proofPoints &&
      'c' in calldata.proofPoints
    ) {
      await expect(
        rollupManager
          .connect(other)
          .submitBatch(
            calldata.proofPoints.a,
            calldata.proofPoints.b,
            calldata.proofPoints.c,
            [calldata.publicSignals[0]],
            exampleRoot,
          ),
      ).to.be.revertedWith('Not an authorized sequencer');
    } else {
      throw new Error('Unsupported proof format: expected Groth16');
    }
  });
});
