// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./RoleManager.sol";

contract EventController is ERC1155Supply {
    using Strings for uint256;
    
    RoleManager public roleManager;
    uint256 private _nextEventId;
    
    struct Event {
        string metadataURI;  // IPFS URI containing event details
        address organizer;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 price;
        bool active;
    }
    
    // eventId => Event
    mapping(uint256 => Event) public events;
    
    // eventId => (tokenId => bool) to track if a ticket has been transferred
    mapping(uint256 => mapping(uint256 => bool)) public ticketTransferred;
    
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string metadataURI,
        uint256 maxTickets,
        uint256 price
    );
    
    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 amount
    );
    
    constructor(address _roleManager) ERC1155("") {
        roleManager = RoleManager(_roleManager);
    }
    
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        // Skip check for minting (from == address(0))
        // Skip check for burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(
                    !ticketTransferred[ids[i]][ids[i]],
                    "Ticket already transferred once"
                );
                ticketTransferred[ids[i]][ids[i]] = true;
            }
        }
        
        super._update(from, to, ids, values);
    }

    /**
     * @dev Creates a new event with tickets as ERC1155 tokens
     */
    function createEvent(
        string calldata metadataURI,
        uint256 maxTickets,
        uint256 price
    ) external returns (uint256) {
        require(
            roleManager.hasRole(roleManager.ORGANIZER_ROLE(), msg.sender),
            "Not organizer"
        );
        
        uint256 eventId = _nextEventId++;
        
        events[eventId] = Event({
            metadataURI: metadataURI,
            organizer: msg.sender,
            maxTickets: maxTickets,
            ticketsSold: 0,
            price: price,
            active: true
        });
        
        emit EventCreated(
            eventId,
            msg.sender,
            metadataURI,
            maxTickets,
            price
        );
        
        return eventId;
    }
    
    /**
     * @dev Purchases tickets for an event
     */
    function purchaseTickets(uint256 eventId, uint256 amount) external payable {
        Event storage eventData = events[eventId];
        require(eventData.active, "Event not active");
        require(
            eventData.ticketsSold + amount <= eventData.maxTickets,
            "Not enough tickets"
        );
        require(msg.value >= eventData.price * amount, "Insufficient payment");
        
        eventData.ticketsSold += amount;
        _mint(msg.sender, eventId, amount, "");
        
        emit TicketPurchased(eventId, msg.sender, amount);
        
        // Return excess payment
        if (msg.value > eventData.price * amount) {
            payable(msg.sender).transfer(msg.value - (eventData.price * amount));
        }
    }
    
    /**
     * @dev Returns the metadata URI for an event
     */
    function uri(uint256 eventId) public view virtual override returns (string memory) {
        return events[eventId].metadataURI;
    }
    
    /**
     * @dev Allows event organizer to update event metadata
     */
    function updateEventMetadata(uint256 eventId, string calldata newMetadataURI) external {
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        events[eventId].metadataURI = newMetadataURI;
    }
    
    /**
     * @dev Allows event organizer to cancel event and refund tickets
     */
    function cancelEvent(uint256 eventId) external {
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        events[eventId].active = false;
    }
} 