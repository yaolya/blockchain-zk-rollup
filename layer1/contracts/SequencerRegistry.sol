// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISequencerRegistry.sol";
import "./interfaces/IDPoSManager.sol";

contract SequencerRegistry is ISequencerRegistry {
    address public owner;
    address public dposManager;

    event DPoSManagerUpdated(address newManager);

    constructor(address _dposManager) {
        owner = msg.sender;
        dposManager = _dposManager;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setDPoSManager(address _newManager) external onlyOwner {
        dposManager = _newManager;
        emit DPoSManagerUpdated(_newManager);
    }

    function isAuthorizedSequencer(address _addr) external view returns (bool) {
        address active = IDPoSManager(dposManager).getActiveSequencer();
        return _addr == active;
    }
}
