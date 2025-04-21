// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";

// TribePoints token contract
contract TribePoints is ERC20, ERC20Burnable {
    address public controller;

    constructor(string memory name, string memory symbol, address _controller) ERC20(name, symbol) {
        controller = _controller;
        _mint(_controller, 1000000000 * 10**decimals()); // Mint initial supply to controller
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == controller, "Only controller can mint");
        _mint(to, amount);
    }
}

contract PointSystem is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    IRoleManager public roleManager;
    ITribeController public tribeController;

    // Point action types
    bytes32 public constant POST_ACTION = keccak256("POST");
    bytes32 public constant COMMENT_ACTION = keccak256("COMMENT");
    bytes32 public constant LIKE_ACTION = keccak256("LIKE");
    bytes32 public constant QUIZ_ACTION = keccak256("QUIZ");
    bytes32 public constant POLL_ACTION = keccak256("POLL");
    bytes32 public constant CUSTOM_ACTION = keccak256("CUSTOM");

    // Tribe ID => Token address
    mapping(uint256 => address) public tribeTokens;
    
    // Tribe ID => Action type => Points value
    mapping(uint256 => mapping(bytes32 => uint256)) public actionPoints;

    // Tribe ID => Member address => Action type => Count
    mapping(uint256 => mapping(address => mapping(bytes32 => uint256))) public actionCounts;

    // Tribe ID => Member list
    mapping(uint256 => address[]) public tribeMembers;
    // Tribe ID => Member count
    mapping(uint256 => uint256) public memberCount;

    event PointsAwarded(uint256 indexed tribeId, address indexed member, uint256 points, bytes32 actionType);
    event PointsDeducted(uint256 indexed tribeId, address indexed member, uint256 points, string reason);
    event ActionPointsUpdated(uint256 indexed tribeId, bytes32 actionType, uint256 points);
    event TribeTokenCreated(uint256 indexed tribeId, address tokenAddress, string name, string symbol);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _roleManager, address _tribeController) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        _;
    }

    modifier onlyActiveMember(uint256 tribeId) {
        require(tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        _;
    }

    function createTribeToken(
        uint256 tribeId,
        string memory name,
        string memory symbol
    ) external onlyTribeAdmin(tribeId) {
        require(tribeTokens[tribeId] == address(0), "Token already exists");
        
        TribePoints token = new TribePoints(name, symbol, address(this));
        tribeTokens[tribeId] = address(token);
        
        emit TribeTokenCreated(tribeId, address(token), name, symbol);
    }

    function setActionPoints(
        uint256 tribeId,
        bytes32 actionType,
        uint256 points
    ) external onlyTribeAdmin(tribeId) {
        actionPoints[tribeId][actionType] = points;
        emit ActionPointsUpdated(tribeId, actionType, points);
    }

    function _awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) internal {
        require(tribeController.getMemberStatus(tribeId, member) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        
        address tokenAddress = tribeTokens[tribeId];
        if (tokenAddress != address(0)) {
            TribePoints(tokenAddress).mint(member, points);
        }
        
        actionCounts[tribeId][member][actionType]++;
        
        // Add member to list if not already present
        bool found = false;
        for (uint256 i = 0; i < memberCount[tribeId]; i++) {
            if (tribeMembers[tribeId][i] == member) {
                found = true;
                break;
            }
        }
        if (!found) {
            tribeMembers[tribeId].push(member);
            memberCount[tribeId]++;
        }
        
        emit PointsAwarded(tribeId, member, points, actionType);
    }

    function awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        _awardPoints(tribeId, member, points, actionType);
    }

    function deductPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        string memory reason
    ) external onlyTribeAdmin(tribeId) {
        address tokenAddress = tribeTokens[tribeId];
        if (tokenAddress != address(0)) {
            require(TribePoints(tokenAddress).balanceOf(member) >= points, "Insufficient points");
            TribePoints(tokenAddress).burnFrom(member, points);
        }
        
        emit PointsDeducted(tribeId, member, points, reason);
    }

    function getMemberPoints(uint256 tribeId, address member) external view returns (uint256) {
        address tokenAddress = tribeTokens[tribeId];
        if (tokenAddress != address(0)) {
            return TribePoints(tokenAddress).balanceOf(member);
        }
        return 0;
    }

    function getActionPoints(uint256 tribeId, bytes32 actionType) external view returns (uint256) {
        return actionPoints[tribeId][actionType];
    }

    function getActionCount(
        uint256 tribeId,
        address member,
        bytes32 actionType
    ) external view returns (uint256) {
        return actionCounts[tribeId][member][actionType];
    }

    function recordAction(
        uint256 tribeId,
        address member,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        uint256 points = actionPoints[tribeId][actionType];
        if (points > 0) {
            _awardPoints(tribeId, member, points, actionType);
        }
    }

    function batchAwardPoints(
        uint256 tribeId,
        address[] memory members,
        uint256 points,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        for (uint256 i = 0; i < members.length; i++) {
            if (tribeController.getMemberStatus(tribeId, members[i]) == ITribeController.MemberStatus.ACTIVE) {
                _awardPoints(tribeId, members[i], points, actionType);
            }
        }
    }

    function getTopMembers(uint256 tribeId, uint256 limit) external view returns (
        address[] memory members,
        uint256[] memory points
    ) {
        members = new address[](limit);
        points = new uint256[](limit);
        
        uint256 count = memberCount[tribeId];
        if (count == 0) return (members, points);
        
        // Get all members with points
        address[] memory allMembers = new address[](count);
        uint256[] memory allPoints = new uint256[](count);
        
        // Collect all members and their points
        for (uint256 i = 0; i < count; i++) {
            address member = tribeMembers[tribeId][i];
            if (member != address(0)) {
                allMembers[i] = member;
                allPoints[i] = this.getMemberPoints(tribeId, member);
            }
        }
        
        // Sort members by points (simple bubble sort for demonstration)
        for (uint256 i = 0; i < count - 1; i++) {
            for (uint256 j = 0; j < count - i - 1; j++) {
                if (allPoints[j] < allPoints[j + 1]) {
                    // Swap points
                    uint256 tempPoints = allPoints[j];
                    allPoints[j] = allPoints[j + 1];
                    allPoints[j + 1] = tempPoints;
                    
                    // Swap addresses
                    address tempAddr = allMembers[j];
                    allMembers[j] = allMembers[j + 1];
                    allMembers[j + 1] = tempAddr;
                }
            }
        }
        
        // Return top N members
        uint256 resultSize = count < limit ? count : limit;
        for (uint256 i = 0; i < resultSize; i++) {
            members[i] = allMembers[i];
            points[i] = allPoints[i];
        }
    }
} 