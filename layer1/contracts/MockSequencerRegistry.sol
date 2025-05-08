// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISequencerRegistry.sol";

contract MockSequencerRegistry is ISequencerRegistry {
    mapping(address => bool) public authorized;

    function setAuthorized(address _addr, bool _auth) external {
        authorized[_addr] = _auth;
    }

    function isAuthorizedSequencer(address _addr) external view override returns (bool) {
        return authorized[_addr];
    }
}
