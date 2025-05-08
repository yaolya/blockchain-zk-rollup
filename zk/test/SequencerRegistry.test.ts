import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { SequencerRegistry, MockDPoSManager } from '../typechain-types';

describe('SequencerRegistry (with DPoS integration)', function () {
  let SequencerRegistry, sequencerRegistry: SequencerRegistry;
  let mockDPoSManager: MockDPoSManager;
  let owner: HardhatEthersSigner,
    activeSequencer: HardhatEthersSigner,
    nonSequencer: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, activeSequencer, nonSequencer] = await ethers.getSigners();

    const MockDPoSManager = await ethers.getContractFactory('MockDPoSManager');
    mockDPoSManager = await MockDPoSManager.deploy();
    await mockDPoSManager.waitForDeployment();

    SequencerRegistry = await ethers.getContractFactory('SequencerRegistry');
    sequencerRegistry = await SequencerRegistry.deploy(mockDPoSManager.target);
    await sequencerRegistry.waitForDeployment();
  });

  it('should deploy with correct owner', async function () {
    expect(await sequencerRegistry.owner()).to.equal(owner.address);
  });

  it('should return true for the active sequencer', async function () {
    await mockDPoSManager.setActiveSequencer(activeSequencer.address);
    const isAuthorized = await sequencerRegistry.isAuthorizedSequencer(
      activeSequencer.address,
    );
    await expect(isAuthorized).to.be.true;
  });

  it('should return false for non-active sequencer', async function () {
    await mockDPoSManager.setActiveSequencer(activeSequencer.address);
    const isAuthorized = await sequencerRegistry.isAuthorizedSequencer(
      nonSequencer.address,
    );
    await expect(isAuthorized).to.be.false;
  });

  it('should allow owner to update DPoSManager', async function () {
    const MockDPoSManager = await ethers.getContractFactory('MockDPoSManager');
    const newMockDPoSManager = await MockDPoSManager.deploy();
    await newMockDPoSManager.waitForDeployment();
    await expect(
      sequencerRegistry
        .connect(owner)
        .setDPoSManager(newMockDPoSManager.target),
    ).to.emit(sequencerRegistry, 'DPoSManagerUpdated');
    expect(await sequencerRegistry.dposManager()).to.equal(
      newMockDPoSManager.target,
    );
  });

  it('should not allow non-owner to update DPoSManager', async function () {
    const MockDPoSManager = await ethers.getContractFactory('MockDPoSManager');
    const newMockDPoSManager = await MockDPoSManager.deploy();
    await newMockDPoSManager.waitForDeployment();
    await expect(
      sequencerRegistry
        .connect(nonSequencer)
        .setDPoSManager(newMockDPoSManager.target),
    ).to.be.revertedWith('Not owner');
  });
});
