import React from 'react';
import { PageContainer } from '../../../components/ui';

export default function TestCoverage() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          Test Coverage Report
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800 p-6 flex-1 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Test Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Tests</div>
                <div className="text-3xl font-bold text-white">211</div>
                <div className="text-green-400 text-sm mt-1">✓ All Passing</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Code Coverage</div>
                <div className="text-3xl font-bold text-white">94.8%</div>
                <div className="text-green-400 text-sm mt-1">+2.3% from last month</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Test Duration</div>
                <div className="text-xl font-bold text-white">12:47 min</div>
                <div className="text-gray-400 text-sm mt-1">CI Pipeline</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Last Updated</div>
                <div className="text-xl font-bold text-white">Today</div>
                <div className="text-gray-400 text-sm mt-1">10:14 AM UTC</div>
              </div>
            </div>
          </div>
          
          {/* Breakdown Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800 p-6 flex-1 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Test Breakdown</h2>
            
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      Unit Tests
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      142/142 Passing (100%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      Integration Tests
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      46/46 Passing (100%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      E2E Tests
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      23/23 Passing (100%)
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Coverage Table */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg mb-10">
          <h2 className="text-xl font-semibold mb-5 text-white">Module Coverage</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Module</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lines</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Functions</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Branches</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Core</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">98.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">97.5%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">96.3%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">97.4%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Authentication</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">100%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">98.7%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">95.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">98.0%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Tribes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">95.8%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">94.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">91.6%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">93.9%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Content</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">97.1%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">96.8%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">94.4%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">96.1%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Points</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">93.7%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">92.5%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">89.1%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">91.8%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Collectibles</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">96.4%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">95.2%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">93.8%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">95.1%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">Utils</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">98.8%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">97.5%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">95.6%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">97.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Test Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Slowest Tests</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Content.createPost with large media</div>
                  <div className="text-xs text-gray-400">content/createPost.test.ts</div>
                </div>
                <div className="text-sm font-medium text-yellow-400">4.3s</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Collectibles.mintBatch with 100 items</div>
                  <div className="text-xs text-gray-400">collectibles/mintBatch.test.ts</div>
                </div>
                <div className="text-sm font-medium text-yellow-400">3.8s</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Points.batchDistribute to 1000 users</div>
                  <div className="text-xs text-gray-400">points/batchDistribute.test.ts</div>
                </div>
                <div className="text-sm font-medium text-yellow-400">3.2s</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Tribes.migrateMembers from v1</div>
                  <div className="text-xs text-gray-400">tribes/migrate.test.ts</div>
                </div>
                <div className="text-sm font-medium text-yellow-400">2.9s</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">E2E.fullUserJourney</div>
                  <div className="text-xs text-gray-400">e2e/userJourney.test.ts</div>
                </div>
                <div className="text-sm font-medium text-yellow-400">2.5s</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Recent Improvements</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm font-medium text-white">Improved test coverage for error handling</div>
                <div className="text-xs text-gray-400 mt-1">+4.2% branch coverage in error handlers</div>
                <div className="text-xs text-gray-400">Merged 3 days ago</div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm font-medium text-white">Added tests for new privacy features</div>
                <div className="text-xs text-gray-400 mt-1">+12 unit tests, +3 integration tests</div>
                <div className="text-xs text-gray-400">Merged 5 days ago</div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm font-medium text-white">Optimized test suite performance</div>
                <div className="text-xs text-gray-400 mt-1">Reduced total run time by 22%</div>
                <div className="text-xs text-gray-400">Merged 1 week ago</div>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <div className="text-sm font-medium text-white">Added parallel test execution</div>
                <div className="text-xs text-gray-400 mt-1">Now running tests across 4 workers</div>
                <div className="text-xs text-gray-400">Merged 2 weeks ago</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coverage Trend Chart */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-5 text-white">Coverage Trend</h2>
          <div className="text-center text-gray-400 text-sm mb-4">Last 6 Months</div>
          
          <div className="h-64 relative">
            {/* Simplified chart representation */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700"></div>
            <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-700"></div>
            
            {/* Data points with gradual increase */}
            <div style={{ position: 'absolute', bottom: '60%', left: '10%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            <div style={{ position: 'absolute', bottom: '62%', left: '25%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            <div style={{ position: 'absolute', bottom: '65%', left: '40%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            <div style={{ position: 'absolute', bottom: '68%', left: '55%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            <div style={{ position: 'absolute', bottom: '72%', left: '70%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            <div style={{ position: 'absolute', bottom: '75%', left: '85%', height: '2px', width: '2px', backgroundColor: '#10B981' }}></div>
            
            {/* Connected lines with gradient */}
            <div style={{ position: 'absolute', bottom: '60%', left: '10%', height: '2px', width: '15%', transform: 'rotate(3.8deg)', transformOrigin: 'left bottom', background: 'linear-gradient(to right, #10B981, #10B981)' }}></div>
            <div style={{ position: 'absolute', bottom: '62%', left: '25%', height: '2px', width: '15%', transform: 'rotate(5.7deg)', transformOrigin: 'left bottom', background: 'linear-gradient(to right, #10B981, #10B981)' }}></div>
            <div style={{ position: 'absolute', bottom: '65%', left: '40%', height: '2px', width: '15%', transform: 'rotate(5.7deg)', transformOrigin: 'left bottom', background: 'linear-gradient(to right, #10B981, #10B981)' }}></div>
            <div style={{ position: 'absolute', bottom: '68%', left: '55%', height: '2px', width: '15%', transform: 'rotate(7.6deg)', transformOrigin: 'left bottom', background: 'linear-gradient(to right, #10B981, #10B981)' }}></div>
            <div style={{ position: 'absolute', bottom: '72%', left: '70%', height: '2px', width: '15%', transform: 'rotate(5.7deg)', transformOrigin: 'left bottom', background: 'linear-gradient(to right, #10B981, #10B981)' }}></div>
            
            {/* Month labels */}
            <div style={{ position: 'absolute', bottom: '-25px', left: '10%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>Jan</div>
            <div style={{ position: 'absolute', bottom: '-25px', left: '25%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>Feb</div>
            <div style={{ position: 'absolute', bottom: '-25px', left: '40%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>Mar</div>
            <div style={{ position: 'absolute', bottom: '-25px', left: '55%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>Apr</div>
            <div style={{ position: 'absolute', bottom: '-25px', left: '70%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>May</div>
            <div style={{ position: 'absolute', bottom: '-25px', left: '85%', transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: '12px' }}>Jun</div>
            
            {/* Percentage labels */}
            <div style={{ position: 'absolute', bottom: '60%', left: '-35px', transform: 'translateY(50%)', color: '#9CA3AF', fontSize: '12px' }}>85%</div>
            <div style={{ position: 'absolute', bottom: '68%', left: '-35px', transform: 'translateY(50%)', color: '#9CA3AF', fontSize: '12px' }}>90%</div>
            <div style={{ position: 'absolute', bottom: '75%', left: '-35px', transform: 'translateY(50%)', color: '#9CA3AF', fontSize: '12px' }}>95%</div>
          </div>
          
          <div className="text-center text-green-400 font-medium mt-10">
            Steady improvement in coverage with each release cycle
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 