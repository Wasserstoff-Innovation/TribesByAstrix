// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./post/PostMinterProxy.sol";

/**
 * @title PostMinter
 * @dev This is a compatibility contract for testing
 * It is identical to PostMinterProxy but allows tests to reference "PostMinter"
 */
contract PostMinter is PostMinterProxy {}
