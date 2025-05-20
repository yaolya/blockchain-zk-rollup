// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISequencerRegistry.sol";
import "./verifiers/BatchProofWithPoseidonGroth16Verifier.sol";

contract RollupManager {
    event NewStateRoot(bytes32 indexed stateRoot, uint256 indexed batchIndex);

    struct Batch {
        bytes32 stateRoot;
        uint256 timestamp;
    }

    mapping(uint256 => Batch) public batches;
    uint256 public batchCount;

    ISequencerRegistry public sequencerRegistry;
    BatchProofWithPoseidonGroth16Verifier public verifier;

    modifier onlySequencer() {
        require(
            sequencerRegistry.isAuthorizedSequencer(msg.sender),
            "Not an authorized sequencer"
        );
        _;
    }

    constructor(address _registry, address _verifier) {
        sequencerRegistry = ISequencerRegistry(_registry);
        verifier = BatchProofWithPoseidonGroth16Verifier(_verifier);
    }

    function submitBatch(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata publicSignals,
        bytes32 _stateRoot
    ) external onlySequencer {
        require(
            verifier.verifyProof(a, b, c, publicSignals),
            "Invalid ZK proof"
        );

        batches[batchCount] = Batch({
            stateRoot: _stateRoot,
            timestamp: block.timestamp
        });

        emit NewStateRoot(_stateRoot, batchCount);
        batchCount++;
    }

    function getLatestStateRoot() external view returns (bytes32) {
        if (batchCount == 0) return bytes32(0);
        return batches[batchCount - 1].stateRoot;
    }
}
