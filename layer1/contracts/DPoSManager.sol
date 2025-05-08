// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IDPoSManager.sol";

contract DPoSManager is IDPoSManager {
    struct Candidate {
        address addr;
        uint256 votes;
        bool registered;
    }

    mapping(address => Candidate) public candidates;
    address[] public candidateList;

    mapping(address => address) public delegations;

    address public activeSequencer;
    address public admin;

    event CandidateRegistered(address indexed candidate);
    event Voted(address indexed delegator, address indexed candidate);
    event SequencerUpdated(address indexed newSequencer);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    function registerCandidate() external {
        require(!candidates[msg.sender].registered, "Already registered");

        candidates[msg.sender] = Candidate({
            addr: msg.sender,
            votes: 0,
            registered: true
        });

        candidateList.push(msg.sender);

        emit CandidateRegistered(msg.sender);
    }

    function delegate(address candidate) external {
        require(candidates[candidate].registered, "Candidate not registered");

        address current = delegations[msg.sender];

        if (current != address(0)) {
            candidates[current].votes -= 1;
        }

        delegations[msg.sender] = candidate;
        candidates[candidate].votes += 1;

        _updateActiveSequencer();

        emit Voted(msg.sender, candidate);
    }

    function getAllCandidates() external view returns (address[] memory) {
        return candidateList;
    }

    function getCandidateVotes(address candidate) external view returns (uint256) {
        return candidates[candidate].votes;
    }

    function _updateActiveSequencer() internal {
        address top = activeSequencer;
        uint256 maxVotes = 0;

        for (uint256 i = 0; i < candidateList.length; i++) {
            address candidateAddr = candidateList[i];
            uint256 voteCount = candidates[candidateAddr].votes;

            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                top = candidateAddr;
            }
        }

        if (top != activeSequencer) {
            activeSequencer = top;
            emit SequencerUpdated(top);
        }
    }

    function getActiveSequencer() external view returns (address) {
        return activeSequencer;
    }

    function setActiveSequencerManually(address candidate) external onlyAdmin {
        require(candidates[candidate].registered, "Not a candidate");
        activeSequencer = candidate;

        emit SequencerUpdated(candidate);
    }
}
