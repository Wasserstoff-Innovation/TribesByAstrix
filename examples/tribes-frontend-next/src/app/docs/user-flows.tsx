import React from 'react';
import { PageContainer } from '../../../components/ui';

// User Flow diagrams with beautiful styling matching the app's design
export default function UserFlows() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          User Flow Documentation
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        <p className="text-gray-300 mb-8">
          Common user flows and journeys through the Tribes platform, illustrating how users interact with the system.
        </p>
        
        {/* User Registration Flow */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-white">User Registration Flow</h2>
          
          <div className="relative">
            {/* Flow Steps */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
              {/* Step 1 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">1</div>
                  <h3 className="text-lg font-medium text-white">Sign Up</h3>
                </div>
                <p className="text-sm text-gray-300">User enters email, username, and password to create an account</p>
                <div className="mt-3 text-xs text-blue-400">auth.signup(email, username, password)</div>
              </div>
              
              {/* Step 2 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">2</div>
                  <h3 className="text-lg font-medium text-white">Verification</h3>
                </div>
                <p className="text-sm text-gray-300">User verifies email via a link or code sent to their inbox</p>
                <div className="mt-3 text-xs text-blue-400">auth.verifyEmail(userId, verificationCode)</div>
              </div>
              
              {/* Step 3 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">3</div>
                  <h3 className="text-lg font-medium text-white">Profile Setup</h3>
                </div>
                <p className="text-sm text-gray-300">User completes profile with bio, avatar, and interests</p>
                <div className="mt-3 text-xs text-blue-400">user.updateProfile(userId, profileData)</div>
              </div>
              
              {/* Step 4 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">4</div>
                  <h3 className="text-lg font-medium text-white">Welcome Tour</h3>
                </div>
                <p className="text-sm text-gray-300">User is guided through key features and UI elements</p>
                <div className="mt-3 text-xs text-blue-400">ui.startOnboarding(userId)</div>
              </div>
              
              {/* Step 5 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/5 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">5</div>
                  <h3 className="text-lg font-medium text-white">Completion</h3>
                </div>
                <p className="text-sm text-gray-300">User is directed to homepage with personalized recommendations</p>
                <div className="mt-3 text-xs text-blue-400">content.getRecommendedTribes(userId)</div>
              </div>
            </div>
            
            {/* Flow Arrows - Hidden on mobile */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/30 transform -translate-y-1/2 z-0"></div>
            
            {/* Alt flows and exceptions */}
            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h4 className="text-md font-medium mb-2 text-white">Alternative Flows</h4>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>If email verification fails, user can request a new code</li>
                <li>Profile setup can be skipped and completed later</li>
                <li>Social login bypasses steps 1-2 but still requires profile setup</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Create and Join Tribe Flow */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-white">Tribe Creation Flow</h2>
          
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
              {/* Step 1 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">1</div>
                  <h3 className="text-lg font-medium text-white">Create Tribe</h3>
                </div>
                <p className="text-sm text-gray-300">User creates a new tribe with name, description and privacy settings</p>
                <div className="mt-3 text-xs text-purple-400">tribes.createTribe(name, description, privacy)</div>
              </div>
              
              {/* Step 2 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">2</div>
                  <h3 className="text-lg font-medium text-white">Customize</h3>
                </div>
                <p className="text-sm text-gray-300">User adds banner image, icon, and configures tribe rules</p>
                <div className="mt-3 text-xs text-purple-400">tribes.updateTribeSettings(tribeId, settings)</div>
              </div>
              
              {/* Step 3 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 mb-4 md:mb-0 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">3</div>
                  <h3 className="text-lg font-medium text-white">Invite Members</h3>
                </div>
                <p className="text-sm text-gray-300">User invites friends via email or generates invite link</p>
                <div className="mt-3 text-xs text-purple-400">tribes.inviteUsers(tribeId, emails) or tribes.createInviteLink(tribeId)</div>
              </div>
              
              {/* Step 4 */}
              <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-full md:w-1/4 relative z-10">
                <div className="flex items-center mb-2">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 font-semibold">4</div>
                  <h3 className="text-lg font-medium text-white">First Post</h3>
                </div>
                <p className="text-sm text-gray-300">User creates welcome post to start tribe activity</p>
                <div className="mt-3 text-xs text-purple-400">content.createPost(tribeId, postData)</div>
              </div>
            </div>
            
            {/* Flow Arrows - Hidden on mobile */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-purple-500/30 transform -translate-y-1/2 z-0"></div>
          </div>
          
          <div className="mt-12">
            <h3 className="text-xl font-medium mb-6 text-white">Joining a Tribe Flow</h3>
            
            <div className="flex flex-col md:flex-row justify-between items-start">
              {/* Pathway 1 */}
              <div className="w-full md:w-1/2 pr-0 md:pr-4 mb-8 md:mb-0">
                <h4 className="text-lg font-medium mb-4 text-white flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">A</span>
                  Via Invite Link
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-500/20 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">1</div>
                    <div>
                      <p className="text-sm text-gray-300">User clicks invite link received via message or email</p>
                      <div className="mt-1 text-xs text-blue-400">tribes.validateInviteLink(inviteCode)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-500/20 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">2</div>
                    <div>
                      <p className="text-sm text-gray-300">User views tribe preview with basic information</p>
                      <div className="mt-1 text-xs text-blue-400">tribes.getTribePreview(tribeId)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-blue-500/20 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">3</div>
                    <div>
                      <p className="text-sm text-gray-300">User confirms join and accepts tribe rules</p>
                      <div className="mt-1 text-xs text-blue-400">tribes.joinTribe(tribeId, userId)</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pathway 2 */}
              <div className="w-full md:w-1/2 pl-0 md:pl-4">
                <h4 className="text-lg font-medium mb-4 text-white flex items-center">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">B</span>
                  Via Discovery
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">1</div>
                    <div>
                      <p className="text-sm text-gray-300">User searches or browses through tribe discovery section</p>
                      <div className="mt-1 text-xs text-green-400">tribes.discoverTribes(filters) or tribes.searchTribes(query)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">2</div>
                    <div>
                      <p className="text-sm text-gray-300">User selects a tribe and views detailed information</p>
                      <div className="mt-1 text-xs text-green-400">tribes.getTribeDetails(tribeId)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">3</div>
                    <div>
                      <p className="text-sm text-gray-300">User requests to join public tribe or submits application for private tribe</p>
                      <div className="mt-1 text-xs text-green-400">tribes.joinTribe(tribeId) or tribes.requestToJoin(tribeId, message)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">4</div>
                    <div>
                      <p className="text-sm text-gray-300">For private tribes, admin must approve request</p>
                      <div className="mt-1 text-xs text-green-400">tribes.reviewJoinRequest(requestId, approved)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Creation and Engagement Flow */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-white">Content Creation & Engagement Flow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Post Creation Flow */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4 text-white flex items-center">
                <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
                Post Creation
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-pink-500/20 text-pink-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">1a</div>
                  <p className="text-sm text-gray-300">User selects tribe and composes post with text, images, or other media</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-pink-500/20 text-pink-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">1b</div>
                  <p className="text-sm text-gray-300">User adds tags, categories, and optional poll or question format</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-pink-500/20 text-pink-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">1c</div>
                  <p className="text-sm text-gray-300">User submits post to be published in tribe feed</p>
                </div>
                
                <div className="mt-2 text-xs text-pink-400 p-2 bg-gray-700/50 rounded-md">
                  content.createPost(tribeId, {'{'}title, body, media, tags, format{'}'})
                </div>
              </div>
            </div>
            
            {/* User Interaction Flow */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4 text-white flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">2</span>
                User Engagement
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-yellow-500/20 text-yellow-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">2a</div>
                  <p className="text-sm text-gray-300">Users view posts in tribe feed, sorted by relevance or recency</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-500/20 text-yellow-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">2b</div>
                  <p className="text-sm text-gray-300">Users react to posts with upvotes, emojis, or custom reactions</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-500/20 text-yellow-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">2c</div>
                  <p className="text-sm text-gray-300">Users comment and participate in threaded discussions</p>
                </div>
                
                <div className="mt-2 text-xs text-yellow-400 p-2 bg-gray-700/50 rounded-md">
                  content.reactToPost(postId, reactionType)<br />
                  content.commentOnPost(postId, comment)
                </div>
              </div>
            </div>
            
            {/* Rewards Flow */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4 text-white flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">3</span>
                Point Rewards
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-500/20 text-green-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">3a</div>
                  <p className="text-sm text-gray-300">Users earn points for quality contributions and community engagement</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-500/20 text-green-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">3b</div>
                  <p className="text-sm text-gray-300">Point awards are calculated based on engagement metrics and tribe rules</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-500/20 text-green-400 rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium text-xs">3c</div>
                  <p className="text-sm text-gray-300">Points can be redeemed for status, privileges, or collectibles</p>
                </div>
                
                <div className="mt-2 text-xs text-green-400 p-2 bg-gray-700/50 rounded-md">
                  points.calculateAward(userId, actionType, contentId)<br />
                  points.redeemPoints(userId, rewardId, pointAmount)
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-medium mb-2 text-white">Implementation Notes</h4>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>Real-time updates using WebSockets ensure immediate visibility of new posts and comments</li>
              <li>Content moderation occurs both pre-posting (automated filters) and post-publishing (user reports)</li>
              <li>Voting systems incorporate anti-manipulation measures to preserve content quality</li>
              <li>Point awards include cooldown periods to prevent spam and gaming of the system</li>
            </ul>
          </div>
        </div>
        
        {/* Collectibles Flow */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-white">Collectibles Acquisition Flow</h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4 text-white">For Users</h3>
              
              <div className="space-y-6">
                <div className="relative pl-7 border-l-2 border-indigo-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">1</div>
                  <p className="text-sm text-gray-300 mb-1">User browses available collectibles in marketplace or tribe rewards</p>
                  <div className="text-xs text-indigo-400">collectibles.listAvailableCollectibles(filters)</div>
                </div>
                
                <div className="relative pl-7 border-l-2 border-indigo-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">2</div>
                  <p className="text-sm text-gray-300 mb-1">User selects collectible and views details, rarity, and acquisition methods</p>
                  <div className="text-xs text-indigo-400">collectibles.getCollectibleDetails(collectibleId)</div>
                </div>
                
                <div className="relative pl-7 border-l-2 border-indigo-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">3</div>
                  <p className="text-sm text-gray-300 mb-1">User acquires collectible through point redemption, challenges, or purchases</p>
                  <div className="text-xs text-indigo-400">collectibles.acquireCollectible(collectibleId, method, payment)</div>
                </div>
                
                <div className="relative pl-7">
                  <div className="absolute left-0 -translate-x-1/2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">4</div>
                  <p className="text-sm text-gray-300 mb-1">User can display collectible on profile, use as badge, or trade with others</p>
                  <div className="text-xs text-indigo-400">collectibles.displayCollectible(collectibleId, displayLocation)</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium mb-4 text-white">For Tribe Creators</h3>
              
              <div className="space-y-6">
                <div className="relative pl-7 border-l-2 border-purple-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">1</div>
                  <p className="text-sm text-gray-300 mb-1">Creator designs a custom collectible with artwork, attributes, and supply limit</p>
                  <div className="text-xs text-purple-400">collectibles.createCollectible(tribeId, metadata, properties)</div>
                </div>
                
                <div className="relative pl-7 border-l-2 border-purple-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">2</div>
                  <p className="text-sm text-gray-300 mb-1">Creator sets acquisition methods (points, challenges, purchases)</p>
                  <div className="text-xs text-purple-400">collectibles.setAcquisitionRules(collectibleId, rules)</div>
                </div>
                
                <div className="relative pl-7 border-l-2 border-purple-500">
                  <div className="absolute left-0 -translate-x-1/2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">3</div>
                  <p className="text-sm text-gray-300 mb-1">Creator mints collectibles and makes them available to tribe members</p>
                  <div className="text-xs text-purple-400">collectibles.mintBatch(collectibleId, quantity)</div>
                </div>
                
                <div className="relative pl-7">
                  <div className="absolute left-0 -translate-x-1/2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center -translate-y-0 top-0 font-medium text-xs">4</div>
                  <p className="text-sm text-gray-300 mb-1">Creator monitors distribution and can adjust rules or create new editions</p>
                  <div className="text-xs text-purple-400">collectibles.getDistributionStats(collectibleId)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 