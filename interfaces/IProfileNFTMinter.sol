pragma solidity ^0.8.0;

interface IProfileNFTMinter {
    // Profile NFT metadata
    struct ProfileNFT {
        string username;
        address avatarNFT;
        uint256 avatarTokenId;
        string bio;
        string website;
        string twitter;
        //... other profile data
    }

    // Mint a new profile NFT
    function mintProfileNFT(
        string memory username,
        address avatarNFT,
        uint256 avatarTokenId,
        string memory bio,
        string memory website,
        string memory twitter
        //... other profile data
    ) external;

    // Get the metadata for a profile NFT
    function getProfileNFT(uint256 tokenId) external view returns (ProfileNFT memory);

    // Get the token ID for a username
    function getTokenIdByUsername(string memory username) external view returns (uint256);

    // Get the token ID for an address
    function getTokenIdByAddress(address userAddress) external view returns (uint256);
}