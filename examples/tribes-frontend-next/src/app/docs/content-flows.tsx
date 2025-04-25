import React from 'react';
import { PageContainer } from '../../../components/ui';

// Content-focused flows for the Tribes SDK with color theme matching the app's design
export default function ContentFlows() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          Content Management Flows
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <p className="text-gray-200 mb-8">
          These diagrams illustrate the key flows for content management within the Tribes platform.
          Each flow shows the interaction between users, applications, the Tribes SDK, and on-chain contracts.
        </p>

        <div className="grid grid-cols-1 gap-10">
          
          {/* Create Post Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Create Post Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Creating and publishing new content within a tribe.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as IPFS Storage
    participant Contracts as ContentContract
    
    User->>App: Create post with text, optional media
    App->>App: Validate input
    
    Note over App,Storage: Handle media (if present)
    opt Media Upload
      App->>Storage: Upload media files
      Storage-->>App: Return media CIDs
    end
    
    App->>SDK: sdk.content.createPost()
    SDK->>SDK: Validate parameters
    
    SDK->>Storage: Upload post metadata
    Storage-->>SDK: Return metadata CID
    
    SDK->>Contracts: createPost(tribeId, metadataCID)
    Contracts-->>SDK: Emit PostCreated event
    SDK-->>App: Return post data with ID
    
    App->>User: Display success and new post
    
    Note over App,User: Optional point earning
    App->>SDK: sdk.points.getUpdatedPoints()
    SDK->>Contracts: getUserPoints()
    Contracts-->>SDK: Return updated points
    SDK-->>App: Return formatted point data
    App->>User: Show points earned animation`}
              </pre>
            </div>
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="text-lg font-semibold text-accent mb-3">Implementation Notes:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Content is stored as metadata on IPFS for decentralized persistence</li>
                <li>The ContentContract manages access control based on tribe membership</li>
                <li>Text content has a maximum of 2,000 characters</li>
                <li>Media types supported: images (PNG, JPG, WEBP), video (MP4), audio (MP3)</li>
                <li>Maximum media file size: 50MB</li>
              </ul>
            </div>
          </div>

          {/* Get Tribe Posts Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Get Tribe Posts Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Retrieving and displaying posts from a specific tribe with pagination.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as IPFS Storage 
    participant Contracts as ContentContract
    
    User->>App: View tribe feed
    App->>SDK: sdk.content.getTribePosts(tribeId, pagination)
    
    SDK->>Contracts: fetchTribePosts(tribeId, limit, offset)
    Contracts-->>SDK: Return post IDs and metadata CIDs
    
    loop For each post
      SDK->>Storage: Fetch metadata from CID
      Storage-->>SDK: Return post metadata
    end
    
    SDK->>SDK: Format and merge post data
    SDK-->>App: Return formatted posts array
    
    App->>App: Process and prepare UI components
    App->>User: Display post feed
    
    Note over App,User: User scrolls to bottom
    User->>App: Scroll triggers pagination
    App->>SDK: sdk.content.getTribePosts() with next page
    
    SDK->>Contracts: fetchTribePosts() with updated offset
    Contracts-->>SDK: Return next page of posts
    SDK-->>App: Return additional posts
    App->>User: Append new posts to feed`}
              </pre>
            </div>
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="text-lg font-semibold text-accent mb-3">Implementation Notes:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Default page size is 20 posts</li>
                <li>Posts are sorted by creation timestamp (newest first)</li>
                <li>SDK handles pagination automatically with cursor-based pagination</li>
                <li>Media previews are generated automatically for various screen sizes</li>
                <li>Encrypted posts will be indicated but content will be hidden until unlocked</li>
              </ul>
            </div>
          </div>

          {/* Post Interaction Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Post Interaction Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Reacting to and commenting on posts within tribes.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as IPFS Storage
    participant Contracts as ContentContract
    
    Note over User,App: React to Post
    
    User->>App: Click reaction button
    App->>SDK: sdk.content.reactToPost(postId, reactionType)
    SDK->>Contracts: recordReaction(postId, reactionType)
    Contracts->>Contracts: Validate user membership
    Contracts->>Contracts: Store reaction
    Contracts-->>SDK: Emit ReactionAdded event
    SDK-->>App: Return updated reaction count
    App->>User: Update UI with new reaction
    
    Note over User,App: Comment on Post
    
    User->>App: Type and submit comment
    App->>SDK: sdk.content.commentOnPost(postId, content)
    
    opt Comment with media
      App->>Storage: Upload media
      Storage-->>App: Return media CID
    end
    
    SDK->>Storage: Upload comment metadata
    Storage-->>SDK: Return metadata CID
    
    SDK->>Contracts: createComment(postId, metadataCID)
    Contracts->>Contracts: Validate user membership
    Contracts->>Contracts: Store comment reference
    Contracts-->>SDK: Emit CommentAdded event
    SDK-->>App: Return comment data
    
    App->>User: Display new comment
    
    Note over App,User: Load Comments
    
    User->>App: View post comments
    App->>SDK: sdk.content.getPostComments(postId)
    SDK->>Contracts: fetchComments(postId)
    Contracts-->>SDK: Return comment IDs and metadata
    
    loop For each comment
      SDK->>Storage: Fetch comment content
      Storage-->>SDK: Return comment metadata
    end
    
    SDK-->>App: Return formatted comments
    App->>User: Display comments thread`}
              </pre>
            </div>
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="text-lg font-semibold text-accent mb-3">Implementation Notes:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Reaction types: Like, Love, Laugh, Wow, Sad, Angry</li>
                <li>Comments support the same media types as posts</li>
                <li>Comments can be nested up to 3 levels deep</li>
                <li>Comment sections support pagination with 10 comments per page</li>
                <li>Comments can be sorted by newest or most popular</li>
              </ul>
            </div>
          </div>

          {/* Delete Post Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Delete Post Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Removing content from a tribe (creator or moderator action).</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Contracts as ContentContract
    
    User->>App: Select post deletion
    App->>App: Show confirmation dialog
    User->>App: Confirm deletion
    
    App->>SDK: sdk.content.deletePost(postId)
    SDK->>Contracts: isPostCreator() or isModeratorForTribe()
    Contracts-->>SDK: Return authorization status
    
    alt If Authorized
      SDK->>Contracts: deletePost(postId)
      Contracts->>Contracts: Mark post as deleted
      Contracts-->>SDK: Emit PostDeleted event
      SDK-->>App: Return success
      App->>User: Show success and remove from UI
    else If Unauthorized
      SDK-->>App: Return error (NOT_AUTHORIZED)
      App->>User: Show error message
    end
    
    Note over App,User: Optional moderation note
    opt Moderator action
      App->>SDK: sdk.tribes.addModerationLog()
      SDK->>Contracts: recordModeration()
      Contracts-->>SDK: Record moderation action
    end`}
              </pre>
            </div>
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="text-lg font-semibold text-accent mb-3">Implementation Notes:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Only the original creator or tribe moderators can delete posts</li>
                <li>Post metadata remains on IPFS but is no longer accessible through the platform</li>
                <li>Deletion is recorded in tribe moderation logs if performed by a moderator</li>
                <li>Automatic content filtering can flag posts for moderation review</li>
                <li>Posts with active replies may require additional confirmation to delete</li>
              </ul>
            </div>
          </div>

          {/* Post Privacy Management Flow */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Post Privacy Management Flow</h2>
            <div className="mb-6">
              <p className="text-gray-300">Creating and accessing posts with different privacy levels within tribes.</p>
            </div>
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
              <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor Creator
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as IPFS Storage
    participant Contracts as ContentContract
    
    Creator->>App: Create post with privacy setting
    
    alt If Public Post
      App->>SDK: sdk.content.createPost(content, {privacy: "public"})
    else If Members-Only Post
      App->>SDK: sdk.content.createPost(content, {privacy: "members"})
    else If Token-Gated Post
      App->>SDK: sdk.content.createPost(content, {privacy: "token", tokenAddress: "0x..."})
    else If Encrypted Post
      App->>SDK: sdk.content.createPost(content, {privacy: "encrypted"})
      SDK->>SDK: Generate encryption key
      SDK->>SDK: Encrypt content
    end
    
    SDK->>Storage: Store post metadata
    Storage-->>SDK: Return metadata CID
    SDK->>Contracts: createPost(tribeId, metadataCID, privacySettings)
    Contracts-->>SDK: Return post ID
    
    Note over Creator,Contracts: Accessing Posts
    
    actor Reader
    Reader->>App: View tribe feed
    App->>SDK: sdk.content.getTribePosts()
    SDK->>Contracts: fetchPosts()
    Contracts-->>SDK: Return posts with privacy flags
    
    loop For each post
      alt If Encrypted Post
        SDK->>SDK: Check access permission
        SDK->>SDK: Decrypt if authorized
      end
    end
    
    SDK-->>App: Return viewable posts
    App->>Reader: Display accessible content`}
              </pre>
            </div>
            <div className="mt-6 text-gray-300 text-sm">
              <h3 className="text-lg font-semibold text-accent mb-3">Privacy Levels:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-accent mb-2">Public</h4>
                  <p>Visible to anyone, even non-tribe members. Indexed by the platform's global search.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-accent mb-2">Members-Only</h4>
                  <p>Only visible to current tribe members. Default setting for most tribes.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-accent mb-2">Token-Gated</h4>
                  <p>Only visible to users who hold specific NFTs or tokens defined in access rules.</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-semibold text-accent mb-2">Encrypted</h4>
                  <p>Content encrypted on-chain, only decryptable by specific wallet addresses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 