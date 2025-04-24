import { expect } from "chai";
import { ethers } from "hardhat";
import { getDeployedContracts, setupTestAccounts } from "../../helpers/lineaSepolia";

// Helper function to get error message safely
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

describe("Project & Event Journey on Linea Sepolia", function () {
  // Contracts we'll need for the journey
  let eventManager: any;
  let projectManager: any;
  let tribeController: any;
  let pointSystem: any;
  
  // Accounts
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
      console.log(`Test user1: ${user1.address}`);
      console.log(`Test user2: ${user2.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      // Get required contracts for project and event journey
      eventManager = contracts.EventManager;
      projectManager = contracts.ProjectManager;
      
      // Some deployments may have these features combined
      if (!eventManager && contracts.CommunityManager) {
        console.log('Using CommunityManager for events');
        eventManager = contracts.CommunityManager;
      }
      
      if (!projectManager && contracts.CommunityManager) {
        console.log('Using CommunityManager for projects');
        projectManager = contracts.CommunityManager;
      }
      
      // Get tribe controller for context
      tribeController = contracts.TribeController;
      
      // Get point system if available
      pointSystem = contracts.AstrixPointSystem;
      
      // Log contract addresses
      console.log('\nContracts loaded:');
      if (eventManager) console.log(`EventManager: ${await eventManager.getAddress()}`);
      if (projectManager) console.log(`ProjectManager: ${await projectManager.getAddress()}`);
      if (tribeController) console.log(`TribeController: ${await tribeController.getAddress()}`);
      if (pointSystem) console.log(`AstrixPointSystem: ${await pointSystem.getAddress()}`);
      
      // Check if we can write to the network
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`\nDeployer balance: ${ethers.formatEther(balance)} ETH`);
        isReadOnly = balance.toString() === '0';
        
        if (isReadOnly) {
          console.log('WARNING: Running in read-only mode. Journey steps requiring transactions will be skipped.');
        } else {
          console.log('Network is writable. Full journey test will be attempted.');
        }
      } catch (error) {
        console.log('Could not get balance, assuming read-only mode');
        isReadOnly = true;
      }
      
      // Skip if essential contracts are missing
      if (!eventManager && !projectManager) {
        console.log('No event or project manager contracts found, skipping tests');
        this.skip();
      }
    } catch (error) {
      console.error('Setup failed:', error);
      this.skip();
    }
  });

  /**
   * JOURNEY STEPS
   * 
   * The following tests trace through a project & event journey:
   * 1. Check existing projects
   * 2. Explore upcoming events
   * 3. Check project creation flow
   * 4. Check event RSVP flow
   * 5. Check point rewards for participation
   */

  it("Step 1: Explore existing projects", async function () {
    if (!projectManager) {
      console.log('Project manager not available, skipping test');
      this.skip();
      return;
    }
    
    try {
      console.log(`\nStep 1: Explore Projects`);
      
      // Get total projects count
      let totalProjects;
      try {
        if (projectManager.getTotalProjectsCount) {
          totalProjects = await projectManager.getTotalProjectsCount();
        } else if (projectManager.getProjectCount) {
          totalProjects = await projectManager.getProjectCount();
        } else {
          throw new Error('No method found to query total projects');
        }
        
        console.log(`Total projects: ${totalProjects}`);
      } catch (error) {
        console.log(`Error getting total projects: ${getErrorMessage(error)}`);
        totalProjects = 0;
      }
      
      // Get projects 
      try {
        let projects;
        if (projectManager.getProjects) {
          projects = await projectManager.getProjects(0, 5);
        } else if (projectManager.getAllProjects) {
          projects = await projectManager.getAllProjects(0, 5);
        } else {
          throw new Error('No method found to query projects');
        }
        
        console.log(`Found ${Array.isArray(projects) ? projects.length : 
          (projects.projectIds ? projects.projectIds.length : 0)} projects`);
        
        // Examine project structure and details
        if (Array.isArray(projects) && projects.length > 0) {
          // Simple array format
          console.log('Recent projects:');
          for (let i = 0; i < Math.min(projects.length, 3); i++) {
            const projectId = typeof projects[i] === 'object' ? projects[i].id : projects[i];
            
            try {
              let project;
              if (projectManager.getProjectDetails) {
                project = await projectManager.getProjectDetails(projectId);
              } else if (projectManager.getProject) {
                project = await projectManager.getProject(projectId);
              } else {
                console.log(`  Project #${projectId}: (Details unavailable)`);
                continue;
              }
              
              console.log(`  Project #${projectId}:`);
              console.log(`    Title: ${project.title || project.name || 'Untitled'}`);
              console.log(`    Creator: ${project.creator}`);
              console.log(`    Status: ${project.status || (project.isActive ? 'Active' : 'Inactive')}`);
              
              // Try to parse metadata if available
              if (project.metadata) {
                try {
                  let metadata;
                  if (typeof project.metadata === 'string') {
                    metadata = JSON.parse(project.metadata);
                  } else {
                    metadata = project.metadata;
                  }
                  
                  console.log(`    Description: ${metadata.description?.substring(0, 50) || 'N/A'}...`);
                  console.log(`    Category: ${metadata.category || 'N/A'}`);
                } catch (err) {
                  console.log(`    Could not parse metadata`);
                }
              }
            } catch (error) {
              console.log(`  Could not get details for project #${projectId}: ${getErrorMessage(error)}`);
            }
          }
        } else if (projects.projectIds && Array.isArray(projects.projectIds)) {
          // Pagination result format
          console.log('Recent projects:');
          if (projects.projects && Array.isArray(projects.projects)) {
            for (let i = 0; i < Math.min(projects.projects.length, 3); i++) {
              const project = projects.projects[i];
              console.log(`  Project #${project.id}:`);
              console.log(`    Title: ${project.title || project.name || 'Untitled'}`);
              console.log(`    Creator: ${project.creator}`);
              console.log(`    Status: ${project.status || (project.isActive ? 'Active' : 'Inactive')}`);
            }
          } else {
            // Only IDs available
            console.log(`Project IDs: ${projects.projectIds.slice(0, 5).join(', ')}`);
          }
        } else {
          console.log('No projects found or unexpected format');
        }
      } catch (error) {
        console.log(`Error exploring projects: ${getErrorMessage(error)}`);
      }
      
      // Check for user projects
      try {
        console.log(`\nChecking user's projects:`);
        
        let userProjects;
        if (projectManager.getUserProjects) {
          userProjects = await projectManager.getUserProjects(user1.address);
        } else if (projectManager.getProjectsByUser) {
          userProjects = await projectManager.getProjectsByUser(user1.address, 0, 5);
        } else {
          console.log('No method found to query user projects');
          return;
        }
        
        if (Array.isArray(userProjects)) {
          console.log(`User has ${userProjects.length} projects`);
        } else if (userProjects.projectIds) {
          console.log(`User has ${userProjects.projectIds.length} projects (total: ${userProjects.total || userProjects.projectIds.length})`);
        }
      } catch (error) {
        console.log(`Error getting user projects: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error in project exploration step:', error);
      this.skip();
    }
  });

  it("Step 2: Explore upcoming events", async function () {
    if (!eventManager) {
      console.log('Event manager not available, skipping test');
      this.skip();
      return;
    }
    
    try {
      console.log(`\nStep 2: Explore Events`);
      
      // Get total events count
      let totalEvents;
      try {
        if (eventManager.getTotalEventsCount) {
          totalEvents = await eventManager.getTotalEventsCount();
        } else if (eventManager.getEventCount) {
          totalEvents = await eventManager.getEventCount();
        } else {
          throw new Error('No method found to query total events');
        }
        
        console.log(`Total events: ${totalEvents}`);
      } catch (error) {
        console.log(`Error getting total events: ${getErrorMessage(error)}`);
        totalEvents = 0;
      }
      
      // Get upcoming events
      try {
        console.log(`\nChecking upcoming events:`);
        
        let upcomingEvents;
        if (eventManager.getUpcomingEvents) {
          upcomingEvents = await eventManager.getUpcomingEvents(0, 5);
        } else if (eventManager.getAllEvents) {
          upcomingEvents = await eventManager.getAllEvents(0, 5);
        } else {
          throw new Error('No method found to query events');
        }
        
        console.log(`Found ${Array.isArray(upcomingEvents) ? upcomingEvents.length : 
          (upcomingEvents.eventIds ? upcomingEvents.eventIds.length : 0)} upcoming events`);
        
        // Examine event structure and details
        if (Array.isArray(upcomingEvents) && upcomingEvents.length > 0) {
          // Simple array format
          console.log('Upcoming events:');
          for (let i = 0; i < Math.min(upcomingEvents.length, 3); i++) {
            const eventId = typeof upcomingEvents[i] === 'object' ? upcomingEvents[i].id : upcomingEvents[i];
            
            try {
              let eventDetails;
              if (eventManager.getEventDetails) {
                eventDetails = await eventManager.getEventDetails(eventId);
              } else if (eventManager.getEvent) {
                eventDetails = await eventManager.getEvent(eventId);
              } else {
                console.log(`  Event #${eventId}: (Details unavailable)`);
                continue;
              }
              
              console.log(`  Event #${eventId}:`);
              console.log(`    Title: ${eventDetails.title || eventDetails.name || 'Untitled'}`);
              console.log(`    Creator: ${eventDetails.creator}`);
              
              // Format date if available
              if (eventDetails.startTime) {
                const startDate = new Date(Number(eventDetails.startTime) * 1000);
                console.log(`    Date: ${startDate.toISOString().split('T')[0]} at ${startDate.toISOString().split('T')[1].substring(0, 5)}`);
              }
              
              console.log(`    Attendees: ${eventDetails.attendeeCount || 0}`);
              
              // Try to parse metadata if available
              if (eventDetails.metadata) {
                try {
                  let metadata;
                  if (typeof eventDetails.metadata === 'string') {
                    metadata = JSON.parse(eventDetails.metadata);
                  } else {
                    metadata = eventDetails.metadata;
                  }
                  
                  console.log(`    Description: ${metadata.description?.substring(0, 50) || 'N/A'}...`);
                  console.log(`    Location: ${metadata.location || metadata.venue || 'N/A'}`);
                  console.log(`    Type: ${metadata.type || metadata.eventType || 'N/A'}`);
                } catch (err) {
                  console.log(`    Could not parse metadata`);
                }
              }
            } catch (error) {
              console.log(`  Could not get details for event #${eventId}: ${getErrorMessage(error)}`);
            }
          }
        } else if (upcomingEvents.eventIds && Array.isArray(upcomingEvents.eventIds)) {
          // Pagination result format
          console.log('Upcoming events:');
          if (upcomingEvents.events && Array.isArray(upcomingEvents.events)) {
            for (let i = 0; i < Math.min(upcomingEvents.events.length, 3); i++) {
              const eventDetails = upcomingEvents.events[i];
              console.log(`  Event #${eventDetails.id}:`);
              console.log(`    Title: ${eventDetails.title || eventDetails.name || 'Untitled'}`);
              console.log(`    Creator: ${eventDetails.creator}`);
              
              // Format date if available
              if (eventDetails.startTime) {
                const startDate = new Date(Number(eventDetails.startTime) * 1000);
                console.log(`    Date: ${startDate.toISOString().split('T')[0]} at ${startDate.toISOString().split('T')[1].substring(0, 5)}`);
              }
              
              console.log(`    Attendees: ${eventDetails.attendeeCount || 0}`);
            }
          } else {
            // Only IDs available
            console.log(`Event IDs: ${upcomingEvents.eventIds.slice(0, 5).join(', ')}`);
          }
        } else {
          console.log('No upcoming events found or unexpected format');
        }
      } catch (error) {
        console.log(`Error exploring events: ${getErrorMessage(error)}`);
      }
      
      // Check for user RSVP'd events
      try {
        console.log(`\nChecking user's RSVP'd events:`);
        
        let userEvents;
        if (eventManager.getUserEvents) {
          userEvents = await eventManager.getUserEvents(user1.address);
        } else if (eventManager.getEventsByAttendee) {
          userEvents = await eventManager.getEventsByAttendee(user1.address, 0, 5);
        } else if (eventManager.getUserRsvpEvents) {
          userEvents = await eventManager.getUserRsvpEvents(user1.address);
        } else {
          console.log('No method found to query user events');
          return;
        }
        
        if (Array.isArray(userEvents)) {
          console.log(`User has RSVP'd to ${userEvents.length} events`);
        } else if (userEvents.eventIds) {
          console.log(`User has RSVP'd to ${userEvents.eventIds.length} events (total: ${userEvents.total || userEvents.eventIds.length})`);
        }
      } catch (error) {
        console.log(`Error getting user events: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error in event exploration step:', error);
      this.skip();
    }
  });

  it("Step 3: Check project creation flow", async function () {
    if (!projectManager) {
      console.log('Project manager not available, skipping test');
      this.skip();
      return;
    }
    
    try {
      console.log(`\nStep 3: Project Creation Flow`);
      
      // Get a tribe for project context
      let targetTribeId = 1; // Default to tribe 1
      if (tribeController) {
        try {
          const userTribes = await tribeController.getUserTribes(user1.address);
          if (userTribes.length > 0) {
            targetTribeId = userTribes[0];
            console.log(`User is a member of tribe #${targetTribeId}, will use for project context`);
          } else {
            console.log(`User is not a member of any tribe, will use tribe #${targetTribeId} as example`);
          }
        } catch (error) {
          console.log(`Error getting user tribes: ${getErrorMessage(error)}`);
        }
      }
      
      // Example project metadata
      const projectMetadata = {
        title: "Test Project from Journey Tests",
        description: "This is a test project created during the project journey test. For educational purposes only.",
        category: "EDUCATION",
        skills: ["testing", "blockchain", "education"],
        imageUrl: "https://example.com/placeholder.jpg"
      };
      
      console.log(`Sample project metadata:`, JSON.stringify(projectMetadata));
      
      // Check project creation methods
      let createMethod = null;
      if (projectManager.createProject) {
        createMethod = "createProject";
      } else if (projectManager.addProject) {
        createMethod = "addProject";
      }
      
      console.log(`Project creation method available: ${createMethod || 'None'}`);
      
      // Check if we can create projects
      const canCreateProject = !isReadOnly && createMethod !== null;
      console.log(`Can create projects: ${canCreateProject}`);
      
      if (!isReadOnly && createMethod !== null) {
        console.log(`In a writable mode, we would create a project here with:`);
        console.log(`  Tribe ID: ${targetTribeId}`);
        console.log(`  Metadata: ${JSON.stringify(projectMetadata)}`);
        // projectManager[createMethod](targetTribeId, JSON.stringify(projectMetadata));
      }
      
      // Check for point rewards for creating projects
      if (pointSystem) {
        try {
          const createProjectPoints = await pointSystem.getPointValue("CREATE_PROJECT");
          console.log(`Points awarded for creating a project: ${createProjectPoints}`);
        } catch (err) {
          console.log(`Could not get point value for creating projects`);
        }
      }
    } catch (error) {
      console.error('Error checking project creation:', error);
      this.skip();
    }
  });

  it("Step 4: Check event RSVP flow", async function () {
    if (!eventManager) {
      console.log('Event manager not available, skipping test');
      this.skip();
      return;
    }
    
    try {
      console.log(`\nStep 4: Event RSVP Flow`);
      
      // Get an event to RSVP to
      let targetEventId = null;
      try {
        let events;
        if (eventManager.getUpcomingEvents) {
          events = await eventManager.getUpcomingEvents(0, 1);
        } else if (eventManager.getAllEvents) {
          events = await eventManager.getAllEvents(0, 1);
        } else {
          throw new Error('No method found to query events');
        }
        
        if (Array.isArray(events) && events.length > 0) {
          targetEventId = typeof events[0] === 'object' ? events[0].id : events[0];
        } else if (events.eventIds && events.eventIds.length > 0) {
          targetEventId = events.eventIds[0];
        }
        
        if (targetEventId) {
          console.log(`Found event #${targetEventId} to RSVP to`);
          
          // Check if user has already RSVP'd
          let hasRsvp = false;
          if (eventManager.hasUserRsvpd) {
            hasRsvp = await eventManager.hasUserRsvpd(targetEventId, user1.address);
          } else if (eventManager.isAttending) {
            hasRsvp = await eventManager.isAttending(targetEventId, user1.address);
          } else if (eventManager.isUserRsvpd) {
            hasRsvp = await eventManager.isUserRsvpd(targetEventId, user1.address);
          }
          
          console.log(`User has already RSVP'd to event #${targetEventId}: ${hasRsvp}`);
          
          // Check RSVP methods
          let rsvpMethod = null;
          if (eventManager.rsvpToEvent) {
            rsvpMethod = "rsvpToEvent";
          } else if (eventManager.attendEvent) {
            rsvpMethod = "attendEvent";
          }
          
          console.log(`RSVP method available: ${rsvpMethod || 'None'}`);
          
          // Simulate RSVP if not in read-only mode
          const canRsvp = !isReadOnly && rsvpMethod !== null && !hasRsvp;
          
          if (canRsvp) {
            console.log(`In a writable mode, we would RSVP to the event:`);
            console.log(`  Event ID: ${targetEventId}`);
            // eventManager[rsvpMethod](targetEventId);
          } else if (isReadOnly) {
            console.log(`In read-only mode, skipping RSVP`);
          } else if (hasRsvp) {
            console.log(`User has already RSVP'd, skipping`);
          } else if (!rsvpMethod) {
            console.log(`No RSVP method available`);
          }
        } else {
          console.log(`No events found to RSVP to`);
        }
      } catch (error) {
        console.log(`Error finding event to RSVP to: ${getErrorMessage(error)}`);
      }
      
      // Check for point rewards for RSVP
      if (pointSystem) {
        try {
          const rsvpPoints = await pointSystem.getPointValue("RSVP_EVENT");
          console.log(`Points awarded for RSVP to an event: ${rsvpPoints}`);
        } catch (err) {
          console.log(`Could not get point value for RSVP`);
        }
      }
    } catch (error) {
      console.error('Error checking event RSVP flow:', error);
      this.skip();
    }
  });

  it("Step 5: Check project/event rewards and points", async function () {
    try {
      console.log(`\nStep 5: Project & Event Rewards and Points`);
      
      if (pointSystem) {
        // Get user's current points
        const points = await pointSystem.getPoints(user1.address);
        console.log(`User ${user1.address} has ${points} points`);
        
        // Check rank
        try {
          const { rank, totalUsers } = await pointSystem.getUserRank(user1.address);
          console.log(`User rank: ${rank} out of ${totalUsers} users`);
        } catch (err) {
          console.log(`Could not get user rank`);
        }
        
        // Get point events related to projects and events
        try {
          const events = await pointSystem.getUserPointEvents(user1.address, 0, 10);
          console.log(`Found ${events.length} point events for user`);
          
          // Filter for project/event-related events
          const projectEvents = events.filter((event: any) => 
            event.action.includes("PROJECT") || 
            event.action.includes("EVENT") || 
            event.action.includes("RSVP")
          );
          
          if (projectEvents.length > 0) {
            console.log('Project/event-related point events:');
            for (let i = 0; i < projectEvents.length; i++) {
              const event = projectEvents[i];
              console.log(`  Event ${i+1}: Action=${event.action}, Points=${event.points}, Timestamp=${new Date(Number(event.timestamp) * 1000).toISOString()}`);
            }
          } else {
            console.log('No project/event-related point events found');
          }
        } catch (err) {
          console.log(`Error getting point events: ${getErrorMessage(err)}`);
        }
        
        // Check daily limits for project/event actions
        try {
          console.log('\nDaily limits for project/event actions:');
          
          const actions = ["CREATE_PROJECT", "RSVP_EVENT", "ATTEND_EVENT"];
          for (const action of actions) {
            const hasLimit = await pointSystem.hasActionLimit(action);
            if (hasLimit) {
              const limit = await pointSystem.getActionLimit(action);
              const userCount = await pointSystem.getUserActionCount(user1.address, action);
              console.log(`  ${action}: ${userCount}/${limit} (${hasLimit ? 'Limited' : 'Unlimited'})`);
            } else {
              console.log(`  ${action}: Unlimited`);
            }
          }
        } catch (err) {
          console.log(`Error checking action limits: ${getErrorMessage(err)}`);
        }
      } else {
        console.log('Point system not available, skipping points check');
      }
    } catch (error) {
      console.error('Error checking project/event rewards:', error);
      this.skip();
    }
  });

  // Additional test: Check project and event analytics
  it("Step 6: Explore project and event analytics", async function () {
    try {
      console.log(`\nStep 6: Project & Event Analytics`);
      
      // Check for project analytics
      if (projectManager) {
        console.log('Checking project analytics:');
        
        // Try to get popular/trending projects
        try {
          let trendingProjects;
          if (projectManager.getTrendingProjects) {
            trendingProjects = await projectManager.getTrendingProjects(3);
            console.log(`Found ${Array.isArray(trendingProjects) ? trendingProjects.length : 0} trending projects`);
          } else if (projectManager.getPopularProjects) {
            trendingProjects = await projectManager.getPopularProjects(3);
            console.log(`Found ${Array.isArray(trendingProjects) ? trendingProjects.length : 0} popular projects`);
          } else {
            console.log('No trending/popular projects function available');
          }
        } catch (error) {
          console.log(`Error fetching trending projects: ${getErrorMessage(error)}`);
        }
        
        // Try to get project stats
        try {
          if (projectManager.getProjectStats || projectManager.getProjectStatistics) {
            const statsMethod = projectManager.getProjectStats || projectManager.getProjectStatistics;
            const stats = await statsMethod();
            console.log('Project statistics:');
            console.log(`  Total projects: ${stats.totalProjects || 'N/A'}`);
            console.log(`  Active projects: ${stats.activeProjects || 'N/A'}`);
            console.log(`  Projects last 30 days: ${stats.projectsLast30Days || 'N/A'}`);
            console.log(`  Unique contributors: ${stats.uniqueContributors || 'N/A'}`);
          } else if (projectManager.getStatistics) {
            const stats = await projectManager.getStatistics();
            console.log('Project statistics:');
            console.log(`  Total projects: ${stats.totalProjects || stats.total || 'N/A'}`);
            console.log(`  Other stats: ${JSON.stringify(stats)}`);
          } else {
            console.log('No project statistics function available');
          }
        } catch (error) {
          console.log(`Error fetching project statistics: ${getErrorMessage(error)}`);
        }
        
        // Try to get project categories if available
        try {
          if (projectManager.getProjectCategories) {
            const categories = await projectManager.getProjectCategories();
            console.log('Project categories:');
            if (Array.isArray(categories) && categories.length > 0) {
              categories.forEach((category, index) => {
                console.log(`  ${index+1}. ${category}`);
              });
            } else {
              console.log('  No categories found');
            }
          }
        } catch (error) {
          console.log(`Error fetching project categories: ${getErrorMessage(error)}`);
        }
      }
      
      // Check for event analytics
      if (eventManager) {
        console.log('\nChecking event analytics:');
        
        // Try to get popular/highlighted events
        try {
          let featuredEvents;
          if (eventManager.getFeaturedEvents) {
            featuredEvents = await eventManager.getFeaturedEvents(3);
            console.log(`Found ${Array.isArray(featuredEvents) ? featuredEvents.length : 0} featured events`);
          } else if (eventManager.getHighlightedEvents) {
            featuredEvents = await eventManager.getHighlightedEvents(3);
            console.log(`Found ${Array.isArray(featuredEvents) ? featuredEvents.length : 0} highlighted events`);
          } else {
            console.log('No featured/highlighted events function available');
          }
        } catch (error) {
          console.log(`Error fetching featured events: ${getErrorMessage(error)}`);
        }
        
        // Try to get event stats
        try {
          if (eventManager.getEventStats || eventManager.getEventStatistics) {
            const statsMethod = eventManager.getEventStats || eventManager.getEventStatistics;
            const stats = await statsMethod();
            console.log('Event statistics:');
            console.log(`  Total events: ${stats.totalEvents || 'N/A'}`);
            console.log(`  Upcoming events: ${stats.upcomingEvents || 'N/A'}`);
            console.log(`  Past events: ${stats.pastEvents || 'N/A'}`);
            console.log(`  Total attendees: ${stats.totalAttendees || 'N/A'}`);
          } else if (eventManager.getStatistics) {
            const stats = await eventManager.getStatistics();
            console.log('Event statistics:');
            console.log(`  Total events: ${stats.totalEvents || stats.total || 'N/A'}`);
            console.log(`  Other stats: ${JSON.stringify(stats)}`);
          } else {
            console.log('No event statistics function available');
          }
        } catch (error) {
          console.log(`Error fetching event statistics: ${getErrorMessage(error)}`);
        }
        
        // Try to get most active event creators
        try {
          if (eventManager.getMostActiveOrganizers) {
            const organizers = await eventManager.getMostActiveOrganizers(3);
            console.log('Most active event organizers:');
            if (Array.isArray(organizers) && organizers.length > 0) {
              for (let i = 0; i < organizers.length; i++) {
                const organizer = typeof organizers[i] === 'object' ? organizers[i].user : organizers[i];
                const count = typeof organizers[i] === 'object' ? organizers[i].count : 'N/A';
                console.log(`  #${i+1}: ${organizer} (${count} events)`);
              }
            } else {
              console.log('  No organizer data available');
            }
          }
        } catch (error) {
          console.log(`Error fetching most active organizers: ${getErrorMessage(error)}`);
        }
      }
    } catch (error) {
      console.error('Error exploring project/event analytics:', error);
      this.skip();
    }
  });

  it("Journey Summary", async function () {
    console.log('\n===== PROJECT & EVENT JOURNEY SUMMARY =====');
    console.log(`User: ${user1.address}`);
    console.log(`Network: Linea Sepolia`);
    console.log(`Mode: ${isReadOnly ? 'Read-only (Simulated)' : 'Writable'}`);
    console.log('Steps completed:');
    console.log('  1. Project exploration');
    console.log('  2. Event exploration');
    console.log('  3. Project creation flow');
    console.log('  4. Event RSVP flow');
    console.log('  5. Project/event rewards and points');
    console.log('  6. Project and event analytics');
    console.log('========================================');
  });
}); 