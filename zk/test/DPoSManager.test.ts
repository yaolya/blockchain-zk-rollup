import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { DPoSManager } from '../typechain-types';

describe('DPoSManager', function () {
  let dpos: DPoSManager;
  let voter1: HardhatEthersSigner,
    voter2: HardhatEthersSigner,
    candidate1: HardhatEthersSigner,
    candidate2: HardhatEthersSigner;

  beforeEach(async function () {
    [voter1, voter2, candidate1, candidate2] = await ethers.getSigners();

    const DPoSManager = await ethers.getContractFactory('DPoSManager');
    dpos = await DPoSManager.deploy();
    await dpos.waitForDeployment();
  });

  it('should allow candidates to register', async function () {
    await expect(dpos.connect(candidate1).registerCandidate())
      .to.emit(dpos, 'CandidateRegistered')
      .withArgs(candidate1.address);

    const candidate = await dpos.candidates(candidate1.address);
    expect(candidate.registered).to.equal(true);

    const all = await dpos.getAllCandidates();
    expect(all).to.include(candidate1.address);
  });

  it('should allow voting and update active sequencer', async function () {
    await dpos.connect(candidate1).registerCandidate();
    await dpos.connect(candidate2).registerCandidate();

    await dpos.connect(voter1).delegate(candidate1.address);
    await dpos.connect(voter2).delegate(candidate1.address);

    const votes = await dpos.getCandidateVotes(candidate1.address);
    expect(votes).to.equal(2);

    const active = await dpos.getActiveSequencer();
    expect(active).to.equal(candidate1.address);
  });

  it('should allow switching votes', async function () {
    await dpos.connect(candidate1).registerCandidate();
    await dpos.connect(candidate2).registerCandidate();

    await dpos.connect(voter1).delegate(candidate1.address);
    await dpos.connect(voter1).delegate(candidate2.address);

    const votes1 = await dpos.getCandidateVotes(candidate1.address);
    const votes2 = await dpos.getCandidateVotes(candidate2.address);

    expect(votes1).to.equal(0);
    expect(votes2).to.equal(1);

    const active = await dpos.getActiveSequencer();
    expect(active).to.equal(candidate2.address);
  });

  it('should allow admin to manually set the sequencer', async function () {
    await dpos.connect(candidate1).registerCandidate();

    await dpos.setActiveSequencerManually(candidate1.address);
    const active = await dpos.getActiveSequencer();
    expect(active).to.equal(candidate1.address);
  });

  it('should reject setting unregistered sequencer manually', async function () {
    await expect(
      dpos.setActiveSequencerManually(candidate2.address),
    ).to.be.revertedWith('Not a candidate');
  });
});
