// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ProfileNFTMinter is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Constants
    uint256 public constant MAX_USERNAME_LENGTH = 20;

    // Profile NFT metadata
    struct ProfileNFT {
        string username;
        address avatarNFT; // Address of the ERC721 NFT used as avatar
        uint256 avatarTokenId; // Token ID of the ERC721 NFT used as avatar
        string bio; // User's bio
        string website; // User's website
        string twitter; // User's Twitter handle
        //... other profile data
    }
    mapping(uint256 => ProfileNFT) public profiles;

    // Mapping from username to token ID
    mapping(string => uint256) public usernameToTokenId;

    // Mapping from address to token ID
    mapping(address => uint256) public addressToTokenId;

    constructor() ERC721("ProfileNFT", "PRO") {}

    // Mint a new profile NFT
    function mintProfileNFT(
        string memory username,
        address avatarNFT,
        uint256 avatarTokenId,
        string memory bio,
        string memory website,
        string memory twitter
    ) public {
        // Input validation
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= MAX_USERNAME_LENGTH, "Username too long");
        require(usernameToTokenId[username] == 0, "Username already taken");
        require(avatarNFT.code.length > 0, "Invalid avatar NFT address");
        //... other validation checks

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        profiles[tokenId] = ProfileNFT({
            username: username,
            avatarNFT: avatarNFT,
            avatarTokenId: avatarTokenId,
            bio: bio,
            website: website,
            twitter: twitter
            //... other profile data
        });

        usernameToTokenId[username] = tokenId;
        addressToTokenId[msg.sender] = tokenId;

        emit ProfileNFTMinted(msg.sender, tokenId, username, avatarNFT, avatarTokenId, bio, website, twitter);
    }

    // Get the metadata for a profile NFT
    function getProfileNFT(uint256 tokenId) public view returns (ProfileNFT memory) {
        return profiles[tokenId];
    }

    // Get the token ID for a username
    function getTokenIdByUsername(string memory username) public view returns (uint256) {
        return usernameToTokenId[username];
    }

    // Get the token ID for an address
    function getTokenIdByAddress(address userAddress) public view returns (uint256) {
        return addressToTokenId[userAddress];
    }

    // Override tokenURI to return a dynamically generated URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
       try this.ownerOf(tokenId) returns (address tokenOwner) {
        ProfileNFT memory profile = profiles[tokenId];
        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
              ? string(
                    abi.encodePacked(
                        baseURI,
                        Strings.toString(tokenId),
                        "?username=",
                        profile.username,
                        "&avatarNFT=",
                        Strings.toHexString(uint160(profile.avatarNFT)),
                        "&avatarTokenId=",
                        Strings.toString(profile.avatarTokenId)
                    )
                )
              : "";
       }catch {
            revert ("Token does not exist");
       }
    }

    // Event emitted when a profile NFT is minted
    event ProfileNFTMinted(
        address indexed user,
        uint256 tokenId,
        string username,
        address avatarNFT,
        uint256 avatarTokenId,
        string bio,
        string website,
        string twitter
        //... other profile data
    );
}