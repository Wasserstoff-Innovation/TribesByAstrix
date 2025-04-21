import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { EventLog } from "ethers";
import {
    RoleManager,
    TribeController,
    EventController,
    CollectibleController,
    PointSystem
} from "../../typechain-types";

describe("Event Journey V2", function () {
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let eventController: EventController;
    let collectibleController: CollectibleController;
    let pointSystem: PointSystem;

    let admin: any;
    let moderator: any;
    let eventOrganizer: any;
    let regularUser1: any;
    let regularUser2: any;
    let nonMember: any;
    let tribeId: number;

    // Helper function to convert BigInt to string in JSON
    function replaceBigInts(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        
        if (Array.isArray(obj)) {
            return obj.map(item => replaceBigInts(item));
        }
        
        const newObj: any = {};
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'bigint') {
                newObj[key] = value.toString();
            } else if (typeof value === 'object' && value !== null) {
                newObj[key] = replaceBigInts(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    }

    before(async function () {
        [admin, moderator, eventOrganizer, regularUser1, regularUser2, nonMember] = await ethers.getSigners();

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
        await roleManager.waitForDeployment();

        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await upgrades.deployProxy(TribeController, [await roleManager.getAddress()], { kind: 'uups' });
        await tribeController.waitForDeployment();

        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await upgrades.deployProxy(PointSystem, [
            await roleManager.getAddress(),
            await tribeController.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await pointSystem.waitForDeployment();

        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await upgrades.deployProxy(CollectibleController, [
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            await pointSystem.getAddress()
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await collectibleController.waitForDeployment();

        const EventController = await ethers.getContractFactory("EventController");
        eventController = await EventController.deploy(await roleManager.getAddress());
        await eventController.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ORGANIZER_ROLE")), eventOrganizer.address);

        // Create test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Event Test Tribe",
            JSON.stringify({ name: "Event Test Tribe", description: "A tribe for testing events" }),
            [admin.address, moderator.address, eventOrganizer.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add members to tribe
        await tribeController.connect(regularUser1).joinTribe(tribeId);
        await tribeController.connect(regularUser2).joinTribe(tribeId);
    });

    describe("Event Creation Scenarios", function () {
        it("Should create a physical event with basic details", async function () {
            const physicalEvent = {
                title: "Physical Meetup 2024",
                description: "In-person community gathering",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: {
                    type: "PHYSICAL",
                    physical: "Main Conference Center",
                    address: "123 Main St, City, Country",
                    coordinates: {
                        latitude: "40.7128",
                        longitude: "-74.0060"
                    }
                },
                capacity: 100,
                ticketTypes: [
                    {
                        name: "Standard",
                        price: ethers.parseEther("0.1"),
                        supply: 100,
                        perWalletLimit: 2
                    }
                ]
            };

            const maxTickets = 100;
            const price = ethers.parseEther("0.1");

            const tx = await eventController.connect(eventOrganizer).createEvent(
                JSON.stringify(replaceBigInts(physicalEvent)),
                maxTickets,
                price
            );
            await expect(tx).to.emit(eventController, "EventCreated");

            const eventId = 0;
            const eventData = await eventController.events(eventId);
            expect(eventData.metadataURI).to.not.be.empty;
            expect(eventData.organizer).to.equal(eventOrganizer.address);
            expect(eventData.maxTickets).to.equal(maxTickets);
            expect(eventData.price).to.equal(price);
            expect(eventData.active).to.be.true;
        });

        it("Should prevent non-organizer from creating event", async function () {
            const physicalEvent = {
                title: "Unauthorized Event",
                description: "Should fail",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: { type: "PHYSICAL", physical: "Test Venue" },
                capacity: 100
            };

            await expect(
                eventController.connect(regularUser1).createEvent(
                    JSON.stringify(replaceBigInts(physicalEvent)),
                    100,
                    ethers.parseEther("0.1")
                )
            ).to.be.revertedWith("Not organizer");
        });

        it("Should test contract-level validations for event creation", async function () {
            const eventMetadata = {
                title: "Test Event",
                description: "Test event",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: { type: "PHYSICAL", physical: "Test Venue" },
                capacity: 100
            };

            // Contract should accept any valid JSON string as metadata
            await expect(
                eventController.connect(eventOrganizer).createEvent(
                    JSON.stringify(replaceBigInts(eventMetadata)),
                    100,
                    ethers.parseEther("0.1")
                )
            ).to.not.be.reverted;

            // Contract should accept empty string as metadata
            await expect(
                eventController.connect(eventOrganizer).createEvent(
                    "",
                    100,
                    ethers.parseEther("0.1")
                )
            ).to.not.be.reverted;

            // Contract should accept zero values for maxTickets and price
            await expect(
                eventController.connect(eventOrganizer).createEvent(
                    JSON.stringify(replaceBigInts(eventMetadata)),
                    0,
                    0
                )
            ).to.not.be.reverted;

            // Only validation is the organizer role check
            await expect(
                eventController.connect(regularUser1).createEvent(
                    JSON.stringify(replaceBigInts(eventMetadata)),
                    100,
                    ethers.parseEther("0.1")
                )
            ).to.be.revertedWith("Not organizer");
        });
    });

    describe("Ticket Purchase and Management", function () {
        let eventId: number;
        let hybridEventMetadata: any;

        beforeEach(async function () {
            // Create a new hybrid event for testing
            hybridEventMetadata = {
                title: "Test Hybrid Event",
                description: "Test event for ticket management",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: {
                    type: "HYBRID",
                    physical: "Test Venue",
                    virtual: "https://test.tribe.com"
                },
                capacity: {
                    physical: 100,
                    virtual: 200
                },
                ticketTypes: [
                    {
                        name: "Virtual",
                        type: "VIRTUAL",
                        price: ethers.parseEther("0.1").toString(),
                        supply: 200,
                        perWalletLimit: 2
                    },
                    {
                        name: "Physical",
                        type: "PHYSICAL",
                        price: ethers.parseEther("0.2").toString(),
                        supply: 100,
                        perWalletLimit: 2
                    }
                ]
            };

            const maxTickets = 300; // Total capacity
            const price = ethers.parseEther("0.1"); // Minimum ticket price

            const tx = await eventController.connect(eventOrganizer).createEvent(
                JSON.stringify(replaceBigInts(hybridEventMetadata)),
                maxTickets,
                price
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "EventCreated"
            ) as EventLog;
            eventId = event ? Number(event.args[0]) : 0;
        });

        it("Should purchase tickets successfully", async function () {
            const amount = 2;
            const price = ethers.parseEther("0.2"); // 0.1 ETH * 2 tickets

            await expect(
                eventController.connect(regularUser1).purchaseTickets(
                    eventId,
                    amount,
                    { value: price }
                )
            ).to.emit(eventController, "TicketPurchased")
             .withArgs(eventId, regularUser1.address, amount);

            const balance = await eventController.balanceOf(regularUser1.address, eventId);
            expect(balance).to.equal(amount);
        });

        it("Should refund excess payment", async function () {
            const amount = 1;
            const excessPayment = ethers.parseEther("0.2"); // 0.1 ETH excess
            
            const initialBalance = await ethers.provider.getBalance(regularUser1.address);
            const tx = await eventController.connect(regularUser1).purchaseTickets(
                eventId,
                amount,
                { value: excessPayment }
            );
            
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            
            const finalBalance = await ethers.provider.getBalance(regularUser1.address);
            const expectedBalance = initialBalance - ethers.parseEther("0.1") - gasUsed;
            
            expect(finalBalance).to.equal(expectedBalance);
        });

        it("Should enforce ticket supply limits", async function () {
            const amount = 301; // Exceeds total supply of 300
            const price = ethers.parseEther("30.1"); // 0.1 ETH * 301 tickets

            await expect(
                eventController.connect(regularUser1).purchaseTickets(
                    eventId,
                    amount,
                    { value: price }
                )
            ).to.be.revertedWith("Not enough tickets");
        });

        it("Should prevent purchase with insufficient payment", async function () {
            const amount = 2;
            const price = ethers.parseEther("0.1"); // Should be 0.2 ETH for 2 tickets

            await expect(
                eventController.connect(regularUser1).purchaseTickets(
                    eventId,
                    amount,
                    { value: price }
                )
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should handle ticket transfers correctly", async function () {
            // First purchase a ticket
            await eventController.connect(regularUser1).purchaseTickets(
                eventId,
                1,
                { value: ethers.parseEther("0.1") }
            );

            // Transfer ticket to regularUser2
            await eventController.connect(regularUser1).safeTransferFrom(
                regularUser1.address,
                regularUser2.address,
                eventId,
                1,
                "0x"
            );

            // Verify transfer
            const newOwnerBalance = await eventController.balanceOf(regularUser2.address, eventId);
            expect(newOwnerBalance).to.equal(1);

            // Verify transfer status
            const isTransferred = await eventController.ticketTransferred(eventId, eventId);
            expect(isTransferred).to.be.true;

            // Try to transfer again (should fail)
            await expect(
                eventController.connect(regularUser2).safeTransferFrom(
                    regularUser2.address,
                    regularUser1.address,
                    eventId,
                    1,
                    "0x"
                )
            ).to.be.revertedWith("Ticket already transferred once");
        });
    });

    describe("Event Management", function () {
        let eventId: number;

        beforeEach(async function () {
            const eventMetadata = {
                title: "Test Event",
                description: "Test event for management",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: { type: "PHYSICAL", physical: "Test Venue" },
                capacity: 100
            };

            const tx = await eventController.connect(eventOrganizer).createEvent(
                JSON.stringify(replaceBigInts(eventMetadata)),
                100,
                ethers.parseEther("0.1")
            );
            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "EventCreated"
            ) as EventLog;
            eventId = event ? Number(event.args[0]) : 0;
        });

        it("Should allow organizer to update metadata", async function () {
            const newMetadata = {
                title: "Updated Event",
                description: "Updated description",
                startDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                endDate: Math.floor(Date.now()/1000) + 31 * 24 * 60 * 60,
                location: { type: "PHYSICAL", physical: "New Venue" },
                capacity: 100
            };

            await eventController.connect(eventOrganizer).updateEventMetadata(
                eventId,
                JSON.stringify(replaceBigInts(newMetadata))
            );

            const event = await eventController.events(eventId);
            expect(event.metadataURI).to.equal(JSON.stringify(replaceBigInts(newMetadata)));
        });

        it("Should prevent non-organizer from updating metadata", async function () {
            const newMetadata = { title: "Unauthorized Update" };

            await expect(
                eventController.connect(regularUser1).updateEventMetadata(
                    eventId,
                    JSON.stringify(replaceBigInts(newMetadata))
                )
            ).to.be.revertedWith("Not event organizer");
        });

        it("Should allow organizer to cancel event", async function () {
            await eventController.connect(eventOrganizer).cancelEvent(eventId);
            const event = await eventController.events(eventId);
            expect(event.active).to.be.false;
        });

        it("Should prevent ticket purchase after cancellation", async function () {
            await eventController.connect(eventOrganizer).cancelEvent(eventId);
            
            await expect(
                eventController.connect(regularUser1).purchaseTickets(
                    eventId,
                    1,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Event not active");
        });

        it("Should prevent non-organizer from canceling event", async function () {
            await expect(
                eventController.connect(regularUser1).cancelEvent(eventId)
            ).to.be.revertedWith("Not event organizer");
        });
    });
}); 