pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CollectibleExtended is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    // Collectible metadata
    struct CollectibleMetadata {
        string name;
        string description;
        string image;
        //... other metadata fields as needed
    }
    mapping(uint256 => CollectibleMetadata) private _collectibleMetadata;

    // Optional: Mapping to store allowed metadata fields for each contract
    mapping(address => string) private _allowedMetadataFields;

    // Mapping to track frozen tokens
    mapping(uint256 => bool) private _frozenTokens;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANAGER_ROLE, msg.sender);
        _setBaseURI(baseURI_);
    }

    // Mint a new collectible
    function mint(
        address to,
        string memory name,
        string memory description,
        string memory image
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        _collectibleMetadata[tokenId] = CollectibleMetadata({
            name: name,
            description: description,
            image: image
        });

        emit CollectibleMinted(to, tokenId);
    }

    // Update collectible metadata
    function updateMetadata(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory image
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        //... (Optional) check if the fields are allowed to be updated based on _allowedMetadataFields

        _collectibleMetadata[tokenId] = CollectibleMetadata({
            name: name,
            description: description,
            image: image
        });

        emit CollectibleMetadataUpdated(tokenId);
    }

    // Get collectible metadata
    function getCollectibleMetadata(uint256 tokenId) public view returns (CollectibleMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
                hasRole(MANAGER_ROLE, msg.sender) ||
                msg.sender == ownerOf(tokenId),
            "Not authorized to view metadata"
        );
        return _collectibleMetadata[tokenId];
    }

    // Freeze a token
    function freezeToken(uint256 tokenId) public onlyRole(MANAGER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        _freezeToken(tokenId);
    }

    // Unfreeze a token
    function unfreezeToken(uint256 tokenId) public onlyRole(MANAGER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        _unfreezeToken(tokenId);
    }

    // Internal function to freeze a token
    function _freezeToken(uint256 tokenId) internal {
        _frozenTokens[tokenId] = true;
        emit TokenFrozen(tokenId);
    }

    // Internal function to unfreeze a token
    function _unfreezeToken(uint256 tokenId) internal {
        _frozenTokens[tokenId] = false;
        emit TokenUnfrozen(tokenId);
    }

    // Override transfer functions to prevent transfers of frozen tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        require(!_frozenTokens[tokenId], "Token is frozen");
    }

    // Events
    event CollectibleMinted(address indexed to, uint256 tokenId);
    event CollectibleMetadataUpdated(uint256 indexed tokenId);
    event TokenFrozen(uint256 indexed tokenId);
    event TokenUnfrozen(uint256 indexed tokenId);
}