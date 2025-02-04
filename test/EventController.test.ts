import { expect } from "chai";
import { ethers } from "hardhat";
import { EventController, RoleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EventController", function () {
  let eventController: EventController;
  let roleManager: RoleManager;
  let owner: SignerWithAddress;
  let organizer: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;

  const EVENT_METADATA = "ipfs://QmTest";
  const MAX_TICKETS = 100;
  const TICKET_PRICE = ethers.parseEther("0.1"); // 0.1 ETH

  beforeEach(async function () {
    [owner, organizer, user, recipient] = await ethers.getSigners();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy EventController
    const EventController = await ethers.getContractFactory("EventController");
    eventController = await EventController.deploy(await roleManager.getAddress());
    await eventController.waitForDeployment();

    // Grant organizer role
    const ORGANIZER_ROLE = await roleManager.ORGANIZER_ROLE();
    await roleManager.grantRole(ORGANIZER_ROLE, organizer.address);
  });

  describe("Event Creation", function () {
    it("Should allow organizer to create event", async function () {
      await expect(
        eventController
          .connect(organizer)
          .createEvent(EVENT_METADATA, MAX_TICKETS, TICKET_PRICE)
      )
        .to.emit(eventController, "EventCreated")
        .withArgs(0, organizer.address, EVENT_METADATA, MAX_TICKETS, TICKET_PRICE);

      const event = await eventController.events(0);
      expect(event.metadataURI).to.equal(EVENT_METADATA);
      expect(event.organizer).to.equal(organizer.address);
      expect(event.maxTickets).to.equal(MAX_TICKETS);
      expect(event.price).to.equal(TICKET_PRICE);
      expect(event.active).to.be.true;
    });

    it("Should prevent non-organizer from creating event", async function () {
      await expect(
        eventController
          .connect(user)
          .createEvent(EVENT_METADATA, MAX_TICKETS, TICKET_PRICE)
      ).to.be.revertedWith("Not organizer");
    });
  });

  describe("Ticket Purchase", function () {
    beforeEach(async function () {
      // Create an event
      await eventController
        .connect(organizer)
        .createEvent(EVENT_METADATA, MAX_TICKETS, TICKET_PRICE);
    });

    it("Should allow user to purchase tickets", async function () {
      const amount = 2;
      const totalPrice = TICKET_PRICE * BigInt(amount);

      await expect(
        eventController.connect(user).purchaseTickets(0, amount, { value: totalPrice })
      )
        .to.emit(eventController, "TicketPurchased")
        .withArgs(0, user.address, amount);

      const event = await eventController.events(0);
      expect(event.ticketsSold).to.equal(amount);

      const balance = await eventController.balanceOf(user.address, 0);
      expect(balance).to.equal(amount);
    });

    it("Should refund excess payment", async function () {
      const amount = 1;
      const excessPayment = ethers.parseEther("0.2"); // 0.2 ETH (0.1 ETH excess)
      
      const initialBalance = await ethers.provider.getBalance(user.address);
      const tx = await eventController
        .connect(user)
        .purchaseTickets(0, amount, { value: excessPayment });
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user.address);
      const expectedBalance = initialBalance - TICKET_PRICE - gasUsed;
      
      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Should prevent purchase when not enough tickets available", async function () {
      await expect(
        eventController
          .connect(user)
          .purchaseTickets(0, MAX_TICKETS + 1, { value: TICKET_PRICE * BigInt(MAX_TICKETS + 1) })
      ).to.be.revertedWith("Not enough tickets");
    });

    it("Should prevent purchase with insufficient payment", async function () {
      await expect(
        eventController
          .connect(user)
          .purchaseTickets(0, 1, { value: TICKET_PRICE - BigInt(1) })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Ticket Transfer", function () {
    beforeEach(async function () {
      // Create event and purchase ticket
      await eventController
        .connect(organizer)
        .createEvent(EVENT_METADATA, MAX_TICKETS, TICKET_PRICE);
      await eventController
        .connect(user)
        .purchaseTickets(0, 1, { value: TICKET_PRICE });
    });

    it("Should allow first transfer", async function () {
      await expect(
        eventController
          .connect(user)
          .safeTransferFrom(user.address, recipient.address, 0, 1, "0x")
      ).to.not.be.reverted;

      const hasTransferred = await eventController.hasTransferredTicket(0, user.address);
      expect(hasTransferred).to.be.true;
    });

    it("Should prevent second transfer", async function () {
      // First transfer
      await eventController
        .connect(user)
        .safeTransferFrom(user.address, recipient.address, 0, 1, "0x");

      // Approve recipient to transfer back
      await eventController
        .connect(recipient)
        .setApprovalForAll(recipient.address, true);

      // Second transfer attempt should fail
      await expect(
        eventController
          .connect(recipient)
          .safeTransferFrom(recipient.address, user.address, 0, 1, "0x")
      ).to.be.revertedWith("Ticket already transferred once");
    });

    it("Should track transfer status correctly", async function () {
      // Check initial status
      expect(await eventController.hasTransferredTicket(0, user.address)).to.be.false;

      // Perform transfer
      await eventController
        .connect(user)
        .safeTransferFrom(user.address, recipient.address, 0, 1, "0x");

      // Check status after transfer
      expect(await eventController.hasTransferredTicket(0, user.address)).to.be.true;
    });

    it("Should handle batch transfers correctly", async function () {
      // Purchase multiple tickets
      await eventController
        .connect(user)
        .purchaseTickets(0, 2, { value: TICKET_PRICE * BigInt(2) });

      // Approve user for batch transfer
      await eventController
        .connect(user)
        .setApprovalForAll(user.address, true);

      // Batch transfer
      await expect(
        eventController
          .connect(user)
          .safeBatchTransferFrom(
            user.address,
            recipient.address,
            [0, 0],
            [1, 1],
            "0x"
          )
      ).to.not.be.reverted;

      // Check transfer status
      expect(await eventController.hasTransferredTicket(0, user.address)).to.be.true;

      // Approve recipient for batch transfer
      await eventController
        .connect(recipient)
        .setApprovalForAll(recipient.address, true);

      // Attempt second batch transfer should fail
      await expect(
        eventController
          .connect(recipient)
          .safeBatchTransferFrom(
            recipient.address,
            user.address,
            [0, 0],
            [1, 1],
            "0x"
          )
      ).to.be.revertedWith("Ticket already transferred once");
    });
  });

  describe("Event Management", function () {
    beforeEach(async function () {
      await eventController
        .connect(organizer)
        .createEvent(EVENT_METADATA, MAX_TICKETS, TICKET_PRICE);
    });

    it("Should allow organizer to update metadata", async function () {
      const newMetadata = "ipfs://QmNewTest";
      await eventController.connect(organizer).updateEventMetadata(0, newMetadata);
      const event = await eventController.events(0);
      expect(event.metadataURI).to.equal(newMetadata);
    });

    it("Should prevent non-organizer from updating metadata", async function () {
      await expect(
        eventController.connect(user).updateEventMetadata(0, "ipfs://QmNewTest")
      ).to.be.revertedWith("Not event organizer");
    });

    it("Should allow organizer to cancel event", async function () {
      await eventController.connect(organizer).cancelEvent(0);
      const event = await eventController.events(0);
      expect(event.active).to.be.false;
    });

    it("Should prevent ticket purchase after cancellation", async function () {
      await eventController.connect(organizer).cancelEvent(0);
      await expect(
        eventController.connect(user).purchaseTickets(0, 1, { value: TICKET_PRICE })
      ).to.be.revertedWith("Event not active");
    });
  });
}); 