// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RoleManager.sol";

contract ProfileNFTMinter is ERC721URIStorage, Ownable {
    RoleManager public roleManager;
    uint256 private _nextTokenId;
    
    // Username to token ID mapping
    mapping(string => uint256) private _usernameToTokenId;
    // Token ID to username mapping
    mapping(uint256 => string) private _tokenIdToUsername;
    // Token ID to metadata mapping
    mapping(uint256 => string) private _tokenMetadata;
    
    // Events
    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string username);
    event ProfileMetadataUpdated(uint256 indexed tokenId, string newMetadataURI);
    
    // Username validation constants
    uint8 constant MIN_USERNAME_LENGTH = 3;
    uint8 constant MAX_USERNAME_LENGTH = 32;
    string constant ALLOWED_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
    
    constructor(address _roleManager) ERC721("Profile NFT", "PROFILE") Ownable(msg.sender) {
        roleManager = RoleManager(_roleManager);
    }
    
    /**
     * @dev Validates username format
     */
    function _validateUsername(string memory username) internal pure returns (bool) {
        bytes memory usernameBytes = bytes(username);
        if (usernameBytes.length < MIN_USERNAME_LENGTH || usernameBytes.length > MAX_USERNAME_LENGTH) {
            return false;
        }
        
        bytes memory allowedChars = bytes(ALLOWED_CHARS);
        for (uint i = 0; i < usernameBytes.length; i++) {
            bool charAllowed = false;
            for (uint j = 0; j < allowedChars.length; j++) {
                if (usernameBytes[i] == allowedChars[j]) {
                    charAllowed = true;
                    break;
                }
            }
            if (!charAllowed) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Checks if username exists
     */
    function usernameExists(string memory username) public view returns (bool) {
        return _usernameToTokenId[_toLowerCase(username)] != 0;
    }
    
    /**
     * @dev Converts string to lowercase for case-insensitive comparison
     */
    function _toLowerCase(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }
    
    /**
     * @dev Creates a new profile NFT
     */
    function createProfile(string memory username, string memory metadataURI) external returns (uint256) {
        require(_validateUsername(username), "Invalid username");
        string memory lowerUsername = _toLowerCase(username);
        require(!usernameExists(lowerUsername), "Username already taken");
        
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _usernameToTokenId[lowerUsername] = tokenId + 1;
        _tokenIdToUsername[tokenId] = username;
        _tokenMetadata[tokenId] = metadataURI;
        
        emit ProfileCreated(tokenId, msg.sender, username);
        return tokenId;
    }
    
    /**
     * @dev Updates profile metadata
     */
    function updateProfileMetadata(uint256 tokenId, string memory newMetadataURI) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _setTokenURI(tokenId, newMetadataURI);
        _tokenMetadata[tokenId] = newMetadataURI;
        emit ProfileMetadataUpdated(tokenId, newMetadataURI);
    }
    
    /**
     * @dev Gets profile data by token ID
     */
    function getProfileByTokenId(uint256 tokenId) external view returns (
        string memory username,
        string memory metadataURI,
        address owner
    ) {
        // If token doesn't exist, ownerOf will revert
        address tokenOwner = ownerOf(tokenId);
        require(bytes(_tokenIdToUsername[tokenId]).length > 0, "Profile does not exist");
        return (
            _tokenIdToUsername[tokenId],
            tokenURI(tokenId),
            tokenOwner
        );
    }
    
    /**
     * @dev Gets token ID by username
     */
    function getTokenIdByUsername(string memory username) external view returns (uint256) {
        uint256 storedId = _usernameToTokenId[_toLowerCase(username)];
        require(storedId != 0, "Username does not exist");
        return storedId - 1;
    }

    /**
     * @dev Override supportsInterface function
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}