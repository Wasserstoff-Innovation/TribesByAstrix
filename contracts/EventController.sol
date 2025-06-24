// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTickets is ERC1155Supply, Ownable {
    using Strings for uint256;

    struct Event {
        string metadataURI;
        address organizer;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 price;
        bool active;
        bool isPrivate;  // Only applicable for free events (price = 0)
    }

    uint256 private _nextEventId;
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(uint256 => bool)) public ticketTransferred;
    mapping(address => mapping(uint256 => uint256)) public ticketRequests;

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string metadataURI,
        uint256 maxTickets,
        uint256 price,
        bool isPrivate
    );

    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 amount
    );

    event TicketRequested(
        uint256 indexed eventId,
        address indexed requester,
        uint256 amount
    );

    event TicketApproved(
        uint256 indexed eventId,
        address indexed requester,
        uint256 amount
    );

    event TicketRejected(
        uint256 indexed eventId,
        address indexed requester,
        uint256 amount
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    function createEvent(
        string calldata metadataURI,
        uint256 maxTickets,
        uint256 price,
        bool isPrivate
    ) external onlyOwner returns (uint256) {
        // Paid events must be public (override isPrivate)
        bool actualIsPrivate = price > 0 ? false : isPrivate;
        
        uint256 eventId = _nextEventId++;
        
        events[eventId] = Event({
            metadataURI: metadataURI,
            organizer: msg.sender,
            maxTickets: maxTickets,
            ticketsSold: 0,
            price: price,
            active: true,
            isPrivate: actualIsPrivate
        });

        emit EventCreated(eventId, msg.sender, metadataURI, maxTickets, price, actualIsPrivate);
        return eventId;
    }

    function requestTickets(uint256 eventId, uint256 amount) external {
        Event storage eventData = events[eventId];
        require(eventData.active, "Event not active");
        require(eventData.isPrivate, "Not a private event");
        require(eventData.price == 0, "Private option only for free events");
        require(eventData.ticketsSold + amount <= eventData.maxTickets, "Not enough tickets");
        
        ticketRequests[msg.sender][eventId] += amount;
        emit TicketRequested(eventId, msg.sender, amount);
    }

    function approveRequest(address requester, uint256 eventId) external {
        require(events[eventId].organizer == msg.sender, "Not organizer");
        uint256 amount = ticketRequests[requester][eventId];
        require(amount > 0, "No pending request");
        
        events[eventId].ticketsSold += amount;
        _mint(requester, eventId, amount, "");
        
        delete ticketRequests[requester][eventId];
        emit TicketApproved(eventId, requester, amount);
    }

    function rejectRequest(address requester, uint256 eventId) external {
        require(events[eventId].organizer == msg.sender, "Not organizer");
        uint256 amount = ticketRequests[requester][eventId];
        require(amount > 0, "No pending request");
        
        delete ticketRequests[requester][eventId];
        emit TicketRejected(eventId, requester, amount);
    }

    function purchaseTickets(uint256 eventId, uint256 amount) external payable {
        Event storage eventData = events[eventId];
        require(eventData.active, "Event not active");
        require(!eventData.isPrivate, "Private event - use request flow");
        require(eventData.ticketsSold + amount <= eventData.maxTickets, "Not enough tickets");
        
        if (eventData.price > 0) {
            require(msg.value >= eventData.price * amount, "Insufficient payment");
            if (msg.value > eventData.price * amount) {
                payable(msg.sender).transfer(msg.value - (eventData.price * amount));
            }
        } else {
            require(msg.value == 0, "Payment not required for free tickets");
        }
        
        eventData.ticketsSold += amount;
        _mint(msg.sender, eventId, amount, "");
        emit TicketPurchased(eventId, msg.sender, amount);
    }

    function uri(uint256 eventId) public view override returns (string memory) {
        return events[eventId].metadataURI;
    }

    function cancelEvent(uint256 eventId) external {
        require(events[eventId].organizer == msg.sender, "Not organizer");
        events[eventId].active = false;
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(!ticketTransferred[ids[i]][ids[i]], "Ticket already transferred");
                ticketTransferred[ids[i]][ids[i]] = true;
            }
        }
        super._update(from, to, ids, values);
    }
}