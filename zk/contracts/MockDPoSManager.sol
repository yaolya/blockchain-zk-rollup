// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IDPoSManager.sol";

contract MockDPoSManager is IDPoSManager {
    address public activeSequencer;

    function setActiveSequencer(address _sequencer) external {
        activeSequencer = _sequencer;
    }

    function getActiveSequencer() external view returns (address) {
        return activeSequencer;
    }
}
