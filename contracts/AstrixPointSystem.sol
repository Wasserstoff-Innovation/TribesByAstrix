// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";
import "./AstrixToken.sol";
import "./TokenDispenser.sol";

// TribePoints token contract (same as in original PointSystem)
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

/**
 * @title AstrixPointSystem
 * @notice Enhanced point system that integrates with Astrix tokens
 * @dev Extends the original PointSystem with Astrix token integration
 */
contract AstrixPointSystem is AccessControl {
    IRoleManager public roleManager;
    ITribeController public tribeController;
    AstrixToken public astrixToken;
    TokenDispenser public tokenDispenser;

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

    // Tribe ID => Organization address
    mapping(uint256 => address) public tribeOrganizations;

    // Tribe ID => Exchange rate (how many tribe tokens per 1 Astrix token)
    mapping(uint256 => uint256) public exchangeRates;

    // Default exchange rate if not set
    uint256 public constant DEFAULT_EXCHANGE_RATE = 1;

    // Tribe ID => Member list
    mapping(uint256 => address[]) public tribeMembers;
    // Tribe ID => Member count
    mapping(uint256 => uint256) public memberCount;

    event PointsAwarded(uint256 indexed tribeId, address indexed member, uint256 points, bytes32 actionType);
    event PointsDeducted(uint256 indexed tribeId, address indexed member, uint256 points, string reason);
    event ActionPointsUpdated(uint256 indexed tribeId, bytes32 actionType, uint256 points);
    event TribeTokenCreated(uint256 indexed tribeId, address tokenAddress, string name, string symbol);
    event TribeOrganizationSet(uint256 indexed tribeId, address organization);
    event ExchangeRateUpdated(uint256 indexed tribeId, uint256 newRate);
    event TokensExchanged(address indexed user, uint256 indexed tribeId, uint256 astrixAmount, uint256 tribeAmount);

    constructor(
        address _roleManager, 
        address _tribeController,
        address _astrixToken,
        address _tokenDispenser
    ) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        astrixToken = AstrixToken(_astrixToken);
        tokenDispenser = TokenDispenser(_tokenDispenser);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        _;
    }

    modifier onlyActiveMember(uint256 tribeId) {
        require(tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        _;
    }

    /**
     * @notice Set the organization that will fund points for a tribe
     * @param tribeId Tribe ID
     * @param organization Organization address
     */
    function setTribeOrganization(uint256 tribeId, address organization) external onlyTribeAdmin(tribeId) {
        require(organization != address(0), "Invalid organization address");
        tribeOrganizations[tribeId] = organization;
        emit TribeOrganizationSet(tribeId, organization);
    }

    /**
     * @notice Set the exchange rate for a tribe
     * @param tribeId Tribe ID
     * @param rate Exchange rate (tribe tokens per 1 Astrix token)
     */
    function setExchangeRate(uint256 tribeId, uint256 rate) external onlyTribeAdmin(tribeId) {
        require(rate > 0, "Exchange rate must be greater than 0");
        exchangeRates[tribeId] = rate;
        emit ExchangeRateUpdated(tribeId, rate);
    }

    /**
     * @notice Create a new tribe token
     * @param tribeId Tribe ID
     * @param name Token name
     * @param symbol Token symbol
     */
    function createTribeToken(
        uint256 tribeId,
        string memory name,
        string memory symbol
    ) external onlyTribeAdmin(tribeId) {
        require(tribeTokens[tribeId] == address(0), "Token already exists");
        
        TribePoints token = new TribePoints(name, symbol, address(this));
        tribeTokens[tribeId] = address(token);
        
        // Default exchange rate if not set
        if (exchangeRates[tribeId] == 0) {
            exchangeRates[tribeId] = DEFAULT_EXCHANGE_RATE;
            emit ExchangeRateUpdated(tribeId, DEFAULT_EXCHANGE_RATE);
        }
        
        emit TribeTokenCreated(tribeId, address(token), name, symbol);
    }

    /**
     * @notice Set points for an action type
     * @param tribeId Tribe ID
     * @param actionType Action type
     * @param points Points value
     */
    function setActionPoints(
        uint256 tribeId,
        bytes32 actionType,
        uint256 points
    ) external onlyTribeAdmin(tribeId) {
        actionPoints[tribeId][actionType] = points;
        emit ActionPointsUpdated(tribeId, actionType, points);
    }

    /**
     * @notice Internal function to award points
     * @param tribeId Tribe ID
     * @param member Member address
     * @param points Points to award
     * @param actionType Action type
     */
    function _awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) internal {
        require(tribeController.getMemberStatus(tribeId, member) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        
        address tokenAddress = tribeTokens[tribeId];
        if (tokenAddress != address(0)) {
            // Calculate how many Astrix tokens are needed based on exchange rate
            uint256 exchangeRate = exchangeRates[tribeId] == 0 ? DEFAULT_EXCHANGE_RATE : exchangeRates[tribeId];
            uint256 astrixNeeded = points / exchangeRate;
            
            // Ensure at least 1 Astrix token is used if points > 0
            if (points > 0 && astrixNeeded == 0) {
                astrixNeeded = 1;
            }
            
            // Get the organization funding this tribe
            address organization = tribeOrganizations[tribeId];
            require(organization != address(0), "Tribe has no funding organization");
            
            // Use token dispenser to spend organization's Astrix tokens
            tokenDispenser.platformSpend(
                organization,
                address(this),
                astrixNeeded,
                string(abi.encodePacked("Points awarded to ", addressToString(member), " in tribe ", uintToString(tribeId)))
            );
            
            // Mint tribe tokens to the member
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

    /**
     * @notice Award points to a member
     * @param tribeId Tribe ID
     * @param member Member address
     * @param points Points to award
     * @param actionType Action type
     */
    function awardPoints(
        uint256 tribeId,
        address member,
        uint256 points,
        bytes32 actionType
    ) external onlyTribeAdmin(tribeId) {
        _awardPoints(tribeId, member, points, actionType);
    }

    /**
     * @notice Deduct points from a member
     * @param tribeId Tribe ID
     * @param member Member address
     * @param points Points to deduct
     * @param reason Reason for deduction
     */
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

    /**
     * @notice Get a member's point balance
     * @param tribeId Tribe ID
     * @param member Member address
     * @return uint256 Point balance
     */
    function getMemberPoints(uint256 tribeId, address member) external view returns (uint256) {
        address tokenAddress = tribeTokens[tribeId];
        if (tokenAddress != address(0)) {
            return TribePoints(tokenAddress).balanceOf(member);
        }
        return 0;
    }

    /**
     * @notice Get the points value for an action
     * @param tribeId Tribe ID
     * @param actionType Action type
     * @return uint256 Points value
     */
    function getActionPoints(uint256 tribeId, bytes32 actionType) external view returns (uint256) {
        return actionPoints[tribeId][actionType];
    }

    /**
     * @notice Get the count of actions performed by a member
     * @param tribeId Tribe ID
     * @param member Member address
     * @param actionType Action type
     * @return uint256 Action count
     */
    function getActionCount(
        uint256 tribeId,
        address member,
        bytes32 actionType
    ) external view returns (uint256) {
        return actionCounts[tribeId][member][actionType];
    }

    /**
     * @notice Record an action performed by a member
     * @param tribeId Tribe ID
     * @param member Member address
     * @param actionType Action type
     */
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

    /**
     * @notice Award points to multiple members
     * @param tribeId Tribe ID
     * @param members Array of member addresses
     * @param points Points to award
     * @param actionType Action type
     */
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

    /**
     * @notice Get the top members by points
     * @param tribeId Tribe ID
     * @param limit Maximum number of members to return
     * @return members Array of member addresses
     * @return points Array of points
     */
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

    /**
     * @notice Exchange Astrix tokens for tribe tokens
     * @param tribeId Tribe ID
     * @param astrixAmount Amount of Astrix tokens to exchange
     */
    function exchangeAstrixForTribeTokens(uint256 tribeId, uint256 astrixAmount) external {
        require(astrixAmount > 0, "Amount must be greater than 0");
        address tokenAddress = tribeTokens[tribeId];
        require(tokenAddress != address(0), "Tribe token does not exist");
        
        // Calculate tribe tokens to mint based on exchange rate
        uint256 exchangeRate = exchangeRates[tribeId] == 0 ? DEFAULT_EXCHANGE_RATE : exchangeRates[tribeId];
        uint256 tribeTokenAmount = astrixAmount * exchangeRate;
        
        // Transfer Astrix tokens from sender to this contract
        astrixToken.transferFrom(msg.sender, address(this), astrixAmount);
        
        // Mint tribe tokens to sender
        TribePoints(tokenAddress).mint(msg.sender, tribeTokenAmount);
        
        emit TokensExchanged(msg.sender, tribeId, astrixAmount, tribeTokenAmount);
    }

    // Helper functions for converting data types to string
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
    
    function uintToString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 j = _i;
        uint256 length;
        
        while (j != 0) {
            length++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
} 