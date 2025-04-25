export const userModule = {
  title: "User Module",
  description: "The User module provides methods for managing user profiles, preferences, and interactions within the Tribes ecosystem.",
  methods: [
    {
      name: "getUserProfile",
      description: "Retrieves a user's profile information by their wallet address",
      parameters: [
        {
          name: "address",
          type: "string",
          description: "The wallet address of the user",
          optional: false
        }
      ],
      returns: {
        type: "Promise<UserProfile>",
        description: "A promise that resolves to the user's profile data"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Get user profile
const address = "0x1234567890abcdef1234567890abcdef12345678";
const profile = await tribes.users.getUserProfile(address);
console.log("User profile:", profile);`
    },
    {
      name: "updateUserProfile",
      description: "Updates the connected user's profile information",
      parameters: [
        {
          name: "profileData",
          type: "UserProfileUpdate",
          description: "The profile data to update",
          optional: false
        }
      ],
      returns: {
        type: "Promise<UserProfile>",
        description: "A promise that resolves to the updated user profile"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Update user profile
const profileUpdate = {
  displayName: "Crypto Explorer",
  bio: "Web3 enthusiast and community builder",
  avatarUrl: "https://example.com/avatar.jpg",
  bannerUrl: "https://example.com/banner.jpg",
  social: {
    twitter: "@cryptoexplorer",
    github: "crypto-explorer"
  }
};

const updatedProfile = await tribes.users.updateUserProfile(profileUpdate);
console.log("Updated profile:", updatedProfile);`
    },
    {
      name: "getJoinedTribes",
      description: "Gets a list of tribes the user has joined",
      parameters: [
        {
          name: "address",
          type: "string",
          description: "The wallet address of the user",
          optional: true
        }
      ],
      returns: {
        type: "Promise<{ tribeId: string; name: string; role: string }[]>",
        description: "A promise that resolves to an array of tribes the user has joined"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Get tribes joined by the connected user
const myTribes = await tribes.users.getJoinedTribes();
console.log("My tribes:", myTribes);

// Or get tribes joined by a specific user
const address = "0x1234567890abcdef1234567890abcdef12345678";
const userTribes = await tribes.users.getJoinedTribes(address);
console.log("User tribes:", userTribes);`
    },
    {
      name: "getNotifications",
      description: "Gets notifications for the connected user",
      parameters: [
        {
          name: "options",
          type: "{ limit?: number; offset?: number; types?: string[] }",
          description: "Optional parameters for pagination and filtering",
          optional: true
        }
      ],
      returns: {
        type: "Promise<Notification[]>",
        description: "A promise that resolves to an array of notifications"
      },
      example: `import { tribes } from '@astrix/tribes-sdk';

// Get all notifications
const allNotifications = await tribes.users.getNotifications();
console.log("All notifications:", allNotifications);

// Get only specific notification types with pagination
const options = {
  limit: 10,
  offset: 0,
  types: ["tribe_invite", "post_mention"]
};
const filteredNotifications = await tribes.users.getNotifications(options);
console.log("Filtered notifications:", filteredNotifications);`
    }
  ]
}; 