// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDPoSManager {
    function getActiveSequencer() external view returns (address);
}
