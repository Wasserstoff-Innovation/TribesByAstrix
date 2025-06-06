// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";
import "./interfaces/IPointSystem.sol";

contract CollectibleController is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    IRoleManager public roleManager;
    ITribeController public tribeController;
    IPointSystem public pointSystem;

    struct Collectible {
        string name;
        string symbol;
        string metadataURI;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 price;
        uint256 pointsRequired;
        bool isActive;
    }

    // Collectible ID => Collectible
    mapping(uint256 => Collectible) public collectibles;
    // Tribe ID => Collectible count
    mapping(uint256 => uint256) public collectibleCount;
    // Collectible ID => Tribe ID
    mapping(uint256 => uint256) public collectibleTribe;

    event CollectibleCreated(uint256 indexed collectibleId, uint256 indexed tribeId, string name, uint256 maxSupply);
    event CollectibleClaimed(uint256 indexed tribeId, uint256 indexed collectibleId, address indexed claimer);
    event CollectibleDeactivated(uint256 indexed collectibleId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _roleManager,
        address _tribeController,
        address _pointSystem
    ) public initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        require(_roleManager != address(0), "Invalid role manager address");
        require(_tribeController != address(0), "Invalid tribe controller address");
        require(_pointSystem != address(0), "Invalid point system address");
        
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        pointSystem = IPointSystem(_pointSystem);
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

    function setPointSystem(address _pointSystem) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pointSystem = IPointSystem(_pointSystem);
    }

    function createCollectible(
        uint256 tribeId,
        string memory name,
        string memory symbol,
        string memory metadataURI,
        uint256 maxSupply,
        uint256 price,
        uint256 pointsRequired
    ) external onlyTribeAdmin(tribeId) returns (uint256) {
        require(bytes(name).length > 0, "Invalid name");
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(bytes(metadataURI).length > 0, "Invalid metadata URI");
        require(maxSupply > 0, "Invalid supply");
        
        uint256 collectibleId = collectibleCount[tribeId];
        
        collectibles[collectibleId] = Collectible({
            name: name,
            symbol: symbol,
            metadataURI: metadataURI,
            maxSupply: maxSupply,
            currentSupply: 0,
            price: price,
            pointsRequired: pointsRequired,
            isActive: true
        });

        collectibleCount[tribeId]++;
        collectibleTribe[collectibleId] = tribeId;

        emit CollectibleCreated(collectibleId, tribeId, name, maxSupply);
        return collectibleId;
    }

    function claimCollectible(uint256 tribeId, uint256 collectibleId) external payable {
        Collectible storage collectible = collectibles[collectibleId];
        require(collectible.isActive, "Collectible not active");
        require(collectibleTribe[collectibleId] == tribeId, "Invalid tribe");
        require(collectible.currentSupply < collectible.maxSupply, "Supply limit reached");
        
        if (collectible.price > 0) {
            require(msg.value >= collectible.price, "Insufficient payment");
        }

        if (collectible.pointsRequired > 0) {
            require(
                pointSystem.getMemberPoints(tribeId, msg.sender) >= collectible.pointsRequired,
                "Insufficient points"
            );
        }

        collectible.currentSupply++;
        _mint(msg.sender, collectibleId, 1, "");

        emit CollectibleClaimed(tribeId, collectibleId, msg.sender);
    }

    function deactivateCollectible(uint256 tribeId, uint256 collectibleId) external onlyTribeAdmin(tribeId) {
        require(collectibleTribe[collectibleId] == tribeId, "Invalid tribe");
        require(collectibles[collectibleId].isActive, "Already deactivated");

        collectibles[collectibleId].isActive = false;
        emit CollectibleDeactivated(collectibleId);
    }

    function getCollectible(uint256 collectibleId) external view returns (Collectible memory) {
        return collectibles[collectibleId];
    }

    function uri(uint256 collectibleId) public view override returns (string memory) {
        return collectibles[collectibleId].metadataURI;
    }

    // Override to prevent unauthorized transfers
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(
            from == msg.sender || 
            isApprovedForAll(from, msg.sender) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Unauthorized transfer"
        );
        super.safeTransferFrom(from, to, id, amount, data);
    }

    // Override to prevent unauthorized batch transfers
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(
            from == msg.sender || 
            isApprovedForAll(from, msg.sender) || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Unauthorized transfer"
        );
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 