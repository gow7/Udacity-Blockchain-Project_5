pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

    struct Star { 
        string name;
        string starStory;
        string ra;
        string dec;
        string mag;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    mapping(bytes32 => bool) public registeredStars;

    function createStar(string _name, string _starStory, string _ra, string _dec, string _mag, uint256 _tokenId) public {
        require(!isRegistredStar(_ra, _dec, _mag), "Star Already Registred");

        // Create star
        Star memory newStar = Star(_name, _starStory, _ra, _dec, _mag);

        // Store and register Star
        tokenIdToStarInfo[_tokenId] = newStar;
        registeredStars[keccak256(abi.encodePacked(_ra, _dec, _mag))] = true;

        _mint(msg.sender, _tokenId);
    }

    function isRegistredStar(string _ra, string _dec, string _mag) private view returns(bool registred) {
        bytes memory params = abi.encodePacked(_ra, _dec, _mag);
        require (params.length > 0, "Empty Coordinates to Register Star");
        return registeredStars[keccak256(params)];
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender, "You are not Authorized to put this Star for sale");

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0, "Star not for sale");
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost, "Not enough value to but the Star");

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function mint(uint256 _tokenId) public {
        _mint(msg.sender, _tokenId);
    }
}