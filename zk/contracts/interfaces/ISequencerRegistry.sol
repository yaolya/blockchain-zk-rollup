// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISequencerRegistry {
    function isAuthorizedSequencer(address _addr) external view returns (bool);
}
