# Event User Flows

This document outlines the key user flows tested in the Event Journey test suite. Each section describes a specific user journey and the corresponding test cases that validate the functionality.

## Setup Flow

**Test**: Before Hook Setup

**Description**: 
The setup flow establishes the fundamental contracts and roles required for the event management ecosystem. It deploys the necessary contracts (RoleManager, TribeController, PointSystem, CollectibleController, and EventController), assigns roles to different users, and creates a test tribe for hosting events.

**User Journey**:
1. Admin deploys all required contracts and establishes their relationships
2. Admin assigns specialized roles (admin, moderator, event organizer)
3. Admin creates a new tribe as a container for event activities
4. Regular users join the tribe to participate in events

## Event Creation Flows

### Physical Event Creation

**Test**: `Should create a physical event with basic details`

**Description**:
This flow tests the basic creation of a physical event by an authorized organizer. It validates that users with the organizer role can successfully create events with parameters for in-person gatherings.

**User Journey**:
1. Event organizer designs a physical meetup with complete details
2. Organizer sets dates, location, coordinates, and capacity
3. Organizer establishes ticket types with pricing and limits
4. Organizer submits the event with metadata, maximum tickets, and base price
5. System validates and stores the event data
6. System emits an EventCreated event to notify tribe members
7. System assigns an event ID for future reference

### Event Access Control

**Test**: `Should prevent non-organizer from creating event`

**Description**:
This flow verifies that only authorized organizers can create events, maintaining the quality and integrity of tribe events.

**User Journey**:
1. Regular user without organizer role attempts to create an event
2. System checks the user's role permissions
3. System rejects the creation attempt with a "Not organizer" error
4. Event is not created in the system

### Event Metadata Validation

**Test**: `Should test contract-level validations for event creation`

**Description**:
This flow tests the system's handling of various metadata formats and validation rules for event creation.

**User Journey**:
1. Organizer creates events with different metadata configurations
2. System accepts valid JSON metadata regardless of content
3. System handles empty metadata strings
4. System accepts various ticket and price configurations
5. System consistently enforces organizer role requirement

## Ticket Purchase and Management Flows

### Standard Ticket Purchase

**Test**: `Should purchase tickets successfully`

**Description**:
This flow tests the basic ticket purchasing functionality, allowing tribe members to secure their attendance at events.

**User Journey**:
1. Event organizer creates a hybrid event with physical and virtual options
2. Regular user views the event details
3. User decides to purchase 2 tickets
4. User sends the exact payment amount for the tickets
5. System processes the purchase and assigns tickets
6. System emits a TicketPurchased event
7. System updates the user's ticket balance
8. User can verify their ticket ownership

### Payment Processing and Refunds

**Test**: `Should refund excess payment`

**Description**:
This flow ensures the system properly handles overpayments by automatically refunding excess amounts to users.

**User Journey**:
1. User decides to purchase 1 ticket at 0.1 ETH
2. User accidentally sends 0.2 ETH (double the required amount)
3. System recognizes the overpayment
4. System processes the ticket purchase at the correct price
5. System automatically refunds the excess 0.1 ETH to the user
6. User receives both the ticket and the refund

### Ticket Supply Enforcement

**Test**: `Should enforce ticket supply limits`

**Description**:
This flow verifies the system enforces ticket supply limits to prevent overselling events.

**User Journey**:
1. Event has a maximum capacity of 300 tickets
2. User attempts to purchase 301 tickets (exceeding capacity)
3. System validates against the maximum supply
4. System rejects the purchase with a "Not enough tickets" error
5. No tickets are issued and payment is not processed

### Payment Validation

**Test**: `Should prevent purchase with insufficient payment`

**Description**:
This flow ensures users must provide sufficient payment to purchase tickets, preventing underpayments.

**User Journey**:
1. User attempts to purchase 2 tickets (requiring 0.2 ETH)
2. User only sends 0.1 ETH (half the required amount)
3. System validates the payment against ticket price
4. System rejects the transaction with "Insufficient payment" error
5. No tickets are issued and payment is returned

### Ticket Transfer

**Test**: `Should handle ticket transfers correctly`

**Description**:
This flow validates that ticket holders can transfer tickets to other users, with appropriate restrictions to prevent ticket scalping.

**User Journey**:
1. User 1 purchases a ticket to an event
2. User 1 decides to transfer the ticket to User 2
3. User 1 initiates a ticket transfer using the NFT transfer functionality
4. System processes the transfer and updates ownership records
5. System flags the ticket as having been transferred once
6. User 2 receives the ticket and can verify ownership
7. User 2 attempts to transfer the ticket again
8. System blocks the second transfer with "Ticket already transferred once" error

## Event Management Flows

### Event Metadata Updates

**Test**: `Should allow organizer to update metadata`

**Description**:
This flow tests the organizer's ability to update event details after creation, allowing for corrections or changes to the event plan.

**User Journey**:
1. Organizer creates an event with initial details
2. Organizer later needs to update event information
3. Organizer submits updated metadata with new title, description, and venue
4. System validates the organizer's authority
5. System updates the stored metadata
6. Changes are immediately visible to potential attendees

### Update Access Control

**Test**: `Should prevent non-organizer from updating metadata`

**Description**:
This flow verifies that only the original organizer can modify event details, maintaining event integrity.

**User Journey**:
1. Regular user attempts to update an event's metadata
2. System checks if the user is the original organizer
3. System rejects the update with "Not event organizer" error
4. Event details remain unchanged

### Event Cancellation

**Test**: `Should allow organizer to cancel event`

**Description**:
This flow enables organizers to cancel events when necessary, updating the event status for all stakeholders.

**User Journey**:
1. Organizer decides to cancel a scheduled event
2. Organizer calls the cancel function for the specific event
3. System validates the organizer's authority
4. System updates the event status to inactive
5. Event remains in the system but is marked as canceled

### Post-Cancellation Protection

**Test**: `Should prevent ticket purchase after cancellation`

**Description**:
This flow ensures users cannot purchase tickets to canceled events, preventing confusion and potential disputes.

**User Journey**:
1. Organizer cancels an event
2. User attempts to purchase tickets to the canceled event
3. System checks the event's active status
4. System rejects the purchase with "Event not active" error
5. No tickets are issued and payment is returned

### Cancellation Access Control

**Test**: `Should prevent non-organizer from canceling event`

**Description**:
This flow verifies that only the original organizer can cancel an event, preventing unauthorized disruption.

**User Journey**:
1. Regular user attempts to cancel someone else's event
2. System checks if the user is the original organizer
3. System rejects the cancellation with "Not event organizer" error
4. Event remains active in the system 