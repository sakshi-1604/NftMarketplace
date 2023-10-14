// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    constructor() ERC721("My NFT", "MNFT") {}

    // Mapping from token ID to token data (for example, IPFS CID)
    mapping(uint256 => string) private _tokenData;

    // Mint a new NFT
    function mint(address to, string memory tokenURI) public onlyOwner {
        uint256 tokenId = totalSupply() + 1;
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    // Get the token data (e.g., IPFS CID) for a specific token
    function getTokenData(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenData[tokenId];
    }
}
