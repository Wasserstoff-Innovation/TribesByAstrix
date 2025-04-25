import React from 'react';
import { PageContainer } from '../../../components/ui';

// Test results with beautiful styling matching the app's design
export default function TestReports() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          Test Reports & Coverage
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <p className="text-gray-200 mb-8">
          Comprehensive test coverage ensures the reliability and stability of the Tribes by Astrix platform. 
          This report summarizes the test results across all system components.
        </p>

        {/* Test Summary Card */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Test Summary</h2>
          
          <div className="flex flex-wrap md:flex-nowrap gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 backdrop-blur-sm rounded-lg p-6 border border-green-800/40 w-full md:w-1/3 flex flex-col items-center justify-center">
              <div className="text-green-400 mb-2 text-lg font-semibold">Test Status</div>
              <div className="flex items-center justify-center bg-green-500/20 rounded-full w-24 h-24 mb-2">
                <span className="text-green-400 text-3xl font-bold">✓</span>
              </div>
              <div className="text-white text-2xl font-bold">All Tests Passing</div>
              <div className="text-green-400 mt-1">211 / 211 Tests</div>
            </div>
            
            <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 flex flex-col items-center">
                <div className="text-accent mb-2 text-lg font-semibold">Code Coverage</div>
                <div className="text-white text-3xl font-bold mb-1">94.8%</div>
                <div className="text-gray-400 text-sm">Overall Coverage</div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 flex flex-col items-center">
                <div className="text-accent mb-2 text-lg font-semibold">Test Duration</div>
                <div className="text-white text-3xl font-bold mb-1">12:47</div>
                <div className="text-gray-400 text-sm">Minutes:Seconds</div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 flex flex-col items-center">
                <div className="text-accent mb-2 text-lg font-semibold">Last Run</div>
                <div className="text-white text-3xl font-bold mb-1">Apr 24</div>
                <div className="text-gray-400 text-sm">April 24, 2025</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-accent">Test Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-white font-semibold">Contract Unit Tests</h4>
                  <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">103 Tests</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mb-2">
                  <div className="h-2 bg-indigo-500 rounded-full" style={{ width: '96.2%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Coverage</span>
                  <span className="text-indigo-400">96.2%</span>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-white font-semibold">Integration Tests</h4>
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">42 Tests</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mb-2">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '92.5%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Coverage</span>
                  <span className="text-purple-400">92.5%</span>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-white font-semibold">Journey Tests</h4>
                  <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">66 Tests</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mb-2">
                  <div className="h-2 bg-pink-500 rounded-full" style={{ width: '95.3%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Coverage</span>
                  <span className="text-pink-400">95.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Test Results */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Detailed Test Results</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/70 border-b border-gray-700">
                  <th className="py-3 px-4 text-left text-white">Test File</th>
                  <th className="py-3 px-4 text-left text-white">Category</th>
                  <th className="py-3 px-4 text-left text-white">Description</th>
                  <th className="py-3 px-4 text-center text-white">Tests</th>
                  <th className="py-3 px-4 text-center text-white">Status</th>
                  <th className="py-3 px-4 text-center text-white">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {/* Unit Tests */}
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">TribeController.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">Unit</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Tribe creation, membership, and access control</td>
                  <td className="py-3 px-4 text-center text-gray-300">24</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">97.1%</td>
                </tr>
                
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">PointSystem.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">Unit</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Points allocation, redemption, and rules</td>
                  <td className="py-3 px-4 text-center text-gray-300">17</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">95.4%</td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">EventController.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">Unit</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Event creation, ticket management, attendance</td>
                  <td className="py-3 px-4 text-center text-gray-300">14</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">93.8%</td>
                </tr>
                
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">CollectibleController.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">Unit</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Collectible creation, minting, and transfers</td>
                  <td className="py-3 px-4 text-center text-gray-300">13</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">98.2%</td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">PostMinter.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">Unit</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Post creation, moderation, privacy settings</td>
                  <td className="py-3 px-4 text-center text-gray-300">12</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">96.5%</td>
                </tr>
                
                {/* Integration Tests */}
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">TribeIntegration.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Integration</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Tribe with tokens, points, and content</td>
                  <td className="py-3 px-4 text-center text-gray-300">12</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">91.4%</td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">ContentSystem.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Integration</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Content creation and interaction flow</td>
                  <td className="py-3 px-4 text-center text-gray-300">10</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">94.2%</td>
                </tr>
                
                {/* Journey Tests */}
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">CommunityCreatorJourney.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">Journey</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Full community creation workflow</td>
                  <td className="py-3 px-4 text-center text-gray-300">14</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">96.2%</td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">EventJourney.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">Journey</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">End-to-end event hosting journey</td>
                  <td className="py-3 px-4 text-center text-gray-300">12</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">95.8%</td>
                </tr>
                
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 font-mono text-sm text-gray-300">FundraiserJourneyV2.test.ts</td>
                  <td className="py-3 px-4 text-sm"><span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">Journey</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">Complete fundraiser lifecycle</td>
                  <td className="py-3 px-4 text-center text-gray-300">10</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                  <td className="py-3 px-4 text-center text-gray-300">96.4%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end mt-4">
            <button className="bg-accent/20 hover:bg-accent/30 text-accent px-4 py-2 rounded-md text-sm transition-colors">
              View Full Report
            </button>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mb-12 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Key Test Scenarios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-accent mb-4">User Authentication & Onboarding</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/70 border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-white text-sm">Test</th>
                    <th className="py-2 px-3 text-left text-white text-sm">Description</th>
                    <th className="py-2 px-3 text-center text-white text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_wallet_connection</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Wallet connection and permissions</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/10">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_profile_creation</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Creating and configuring user profile</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_profile_nft_minting</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Profile NFT minting and verification</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-accent mb-4">Tribe Management</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/70 border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-white text-sm">Test</th>
                    <th className="py-2 px-3 text-left text-white text-sm">Description</th>
                    <th className="py-2 px-3 text-center text-white text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_tribe_creation</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Creating tribes with various access models</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/10">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_public_tribe_join</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Joining a public tribe</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_nft_gated_tribe</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Accessing NFT-gated tribe with proper NFT</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-accent mb-4">Content & Engagement</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/70 border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-white text-sm">Test</th>
                    <th className="py-2 px-3 text-left text-white text-sm">Description</th>
                    <th className="py-2 px-3 text-center text-white text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_post_creation</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Creating various post types</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/10">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_encrypted_post</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Posts with encryption for privacy</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_post_interaction</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Likes, comments, and other interactions</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-accent mb-4">Events & Fundraisers</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/70 border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-white text-sm">Test</th>
                    <th className="py-2 px-3 text-left text-white text-sm">Description</th>
                    <th className="py-2 px-3 text-center text-white text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_physical_event_creation</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Creating in-person events</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/10">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_ticket_purchase</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Purchasing event tickets</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                  <tr className="bg-gray-900/30">
                    <td className="py-2 px-3 font-mono text-xs text-gray-300">test_fundraiser_creation</td>
                    <td className="py-2 px-3 text-xs text-gray-300">Creating and managing fundraisers</td>
                    <td className="py-2 px-3 text-center"><span className="text-green-400">✓</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance Testing */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Performance Testing</h2>
          
          <div className="mb-6">
            <p className="text-gray-300">Performance tests evaluate system behavior under various load conditions to ensure scalability.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/70 border-b border-gray-700">
                  <th className="py-3 px-4 text-left text-white">Test Scenario</th>
                  <th className="py-3 px-4 text-center text-white">Users</th>
                  <th className="py-3 px-4 text-center text-white">Operations</th>
                  <th className="py-3 px-4 text-center text-white">Avg Response</th>
                  <th className="py-3 px-4 text-center text-white">P95 Response</th>
                  <th className="py-3 px-4 text-center text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 text-gray-300">Tribe creation</td>
                  <td className="py-3 px-4 text-center text-gray-300">100</td>
                  <td className="py-3 px-4 text-center text-gray-300">100 tribes</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.2s</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.8s</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                </tr>
                
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 text-gray-300">Post creation</td>
                  <td className="py-3 px-4 text-center text-gray-300">500</td>
                  <td className="py-3 px-4 text-center text-gray-300">2,000 posts</td>
                  <td className="py-3 px-4 text-center text-gray-300">0.8s</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.4s</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 text-gray-300">Feed loading</td>
                  <td className="py-3 px-4 text-center text-gray-300">1,000</td>
                  <td className="py-3 px-4 text-center text-gray-300">1,000 feeds</td>
                  <td className="py-3 px-4 text-center text-gray-300">0.3s</td>
                  <td className="py-3 px-4 text-center text-gray-300">0.6s</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                </tr>
                
                <tr className="bg-gray-900/10">
                  <td className="py-3 px-4 text-gray-300">Concurrent joins</td>
                  <td className="py-3 px-4 text-center text-gray-300">200</td>
                  <td className="py-3 px-4 text-center text-gray-300">200 joins</td>
                  <td className="py-3 px-4 text-center text-gray-300">0.9s</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.5s</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                </tr>
                
                <tr className="bg-gray-900/30">
                  <td className="py-3 px-4 text-gray-300">Collectible claims</td>
                  <td className="py-3 px-4 text-center text-gray-300">300</td>
                  <td className="py-3 px-4 text-center text-gray-300">300 claims</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.1s</td>
                  <td className="py-3 px-4 text-center text-gray-300">1.7s</td>
                  <td className="py-3 px-4 text-center"><span className="text-green-400">✓</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Continuous Integration</h3>
            <p className="text-gray-300 mb-3">All tests are run automatically on each pull request using our CI/CD pipeline:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="font-semibold text-accent mb-1">Pre-commit</div>
                <div className="text-gray-300">Linting and formatting checks</div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="font-semibold text-accent mb-1">Pull Request</div>
                <div className="text-gray-300">Unit and integration tests</div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="font-semibold text-accent mb-1">Staging</div>
                <div className="text-gray-300">Full test suite including journeys</div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="font-semibold text-accent mb-1">Production</div>
                <div className="text-gray-300">Smoke tests and performance checks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 