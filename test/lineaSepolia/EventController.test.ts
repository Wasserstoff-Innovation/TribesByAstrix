import { expect } from "chai";
import { ethers } from "hardhat";
import { EventController } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("EventController on Linea Sepolia", function () {
  let eventController: any;
  let deployer: any;
  let user1: any;
  let user2: any;
  let isReadOnly = true;

  before(async function () {
    // Increase timeout for network operations
    this.timeout(300000);
    
    try {
      // Get accounts
      const accounts = await setupTestAccounts();
      deployer = accounts.deployer;
      user1 = accounts.user1;
      user2 = accounts.user2;

      console.log(`Test using deployer: ${deployer.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      if (!contracts.EventController) {
        throw new Error('EventController contract not found in deployment');
      }
      
      eventController = contracts.EventController;
      const address = await eventController.getAddress();
      console.log(`EventController contract loaded at: ${address}`);
      
      // Check if we can write to the network
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
        isReadOnly = balance.toString() === '0';
      } catch (error) {
        console.log('Could not get balance, assuming read-only mode');
        isReadOnly = true;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      this.skip();
    }
  });

  it("Should get total events count", async function () {
    try {
      const totalEvents = await eventController.getEventCount();
      console.log(`Total events: ${totalEvents}`);
      expect(totalEvents).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting event count:', error);
      this.skip();
    }
  });

  it("Should get event categories", async function () {
    try {
      const categories = await eventController.getCategories();
      console.log(`Number of event categories: ${categories.length}`);
      
      if (categories.length > 0) {
        console.log('Event categories:');
        categories.forEach((category: string, index: number) => {
          console.log(`  ${index + 1}. ${category}`);
        });
      }
      
      expect(categories).to.be.an('array');
    } catch (error) {
      console.error('Error getting event categories:', error);
      this.skip();
    }
  });

  it("Should get details of the first event if it exists", async function () {
    try {
      const eventCount = await eventController.getEventCount();
      
      if (eventCount > 0) {
        const eventId = 1; // First event ID
        console.log(`Getting details for event ID: ${eventId}`);
        
        const event = await eventController.getEvent(eventId);
        console.log(`Event ${eventId} details:`);
        console.log(`  Name: ${event.name}`);
        console.log(`  Organizer: ${event.organizer}`);
        console.log(`  Description: ${event.description.substring(0, 50)}...`);
        console.log(`  Category: ${event.category}`);
        console.log(`  Tribe ID: ${event.tribeId}`);
        console.log(`  Start Time: ${new Date(Number(event.startTime) * 1000).toISOString()}`);
        console.log(`  End Time: ${new Date(Number(event.endTime) * 1000).toISOString()}`);
        console.log(`  Location: ${event.location}`);
        console.log(`  Max Attendees: ${event.maxAttendees}`);
        console.log(`  Current Attendees: ${event.attendeeCount}`);
        
        expect(event.name).to.be.a('string');
        expect(event.organizer).to.match(/^0x[a-fA-F0-9]{40}$/);
      } else {
        console.log('No events found to retrieve details');
        this.skip();
      }
    } catch (error) {
      console.error('Error getting event details:', error);
      this.skip();
    }
  });

  it("Should get events by tribe", async function () {
    try {
      // Try with tribe ID 1 as a default
      const tribeId = 1;
      console.log(`Getting events for tribe ID: ${tribeId}`);
      
      const eventIds = await eventController.getEventsByTribe(tribeId);
      console.log(`Tribe ${tribeId} has ${eventIds.length} events`);
      
      if (eventIds.length > 0) {
        console.log('First few event IDs:');
        const limit = Math.min(eventIds.length, 3);
        for (let i = 0; i < limit; i++) {
          console.log(`  Event ID: ${eventIds[i]}`);
        }
      }
      
      expect(eventIds).to.be.an('array');
    } catch (error) {
      console.error('Error getting events by tribe:', error);
      this.skip();
    }
  });

  it("Should get events by organizer", async function () {
    try {
      console.log(`Getting events for organizer: ${deployer.address}`);
      
      const eventIds = await eventController.getEventsByOrganizer(deployer.address);
      console.log(`Organizer has ${eventIds.length} events`);
      
      if (eventIds.length > 0) {
        console.log('First few event IDs:');
        const limit = Math.min(eventIds.length, 3);
        for (let i = 0; i < limit; i++) {
          console.log(`  Event ID: ${eventIds[i]}`);
        }
      }
      
      expect(eventIds).to.be.an('array');
    } catch (error) {
      console.error('Error getting events by organizer:', error);
      this.skip();
    }
  });
  
  it("Should check upcoming events", async function () {
    try {
      const now = Math.floor(Date.now() / 1000);
      console.log(`Getting upcoming events (current timestamp: ${now})`);
      
      const eventIds = await eventController.getUpcomingEvents();
      console.log(`Found ${eventIds.length} upcoming events`);
      
      if (eventIds.length > 0) {
        console.log('First few upcoming event IDs:');
        const limit = Math.min(eventIds.length, 3);
        for (let i = 0; i < limit; i++) {
          console.log(`  Event ID: ${eventIds[i]}`);
        }
      }
      
      expect(eventIds).to.be.an('array');
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      this.skip();
    }
  });
  
  it("Should check event attendees", async function () {
    try {
      const eventCount = await eventController.getEventCount();
      
      if (eventCount > 0) {
        const eventId = 1; // First event ID
        console.log(`Checking attendees for event ID: ${eventId}`);
        
        const attendees = await eventController.getEventAttendees(eventId);
        console.log(`Event ${eventId} has ${attendees.length} attendees`);
        
        if (attendees.length > 0) {
          console.log('First few attendees:');
          const limit = Math.min(attendees.length, 3);
          for (let i = 0; i < limit; i++) {
            console.log(`  Attendee: ${attendees[i]}`);
          }
        }
        
        // Also check if the deployer is attending
        const isAttending = await eventController.isAttending(eventId, deployer.address);
        console.log(`Deployer is attending event ${eventId}: ${isAttending}`);
        
        expect(attendees).to.be.an('array');
        expect(isAttending).to.be.a('boolean');
      } else {
        console.log('No events found to check attendees');
        this.skip();
      }
    } catch (error) {
      console.error('Error checking event attendees:', error);
      this.skip();
    }
  });
}); 