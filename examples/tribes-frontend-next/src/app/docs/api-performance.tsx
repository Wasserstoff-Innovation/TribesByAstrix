import React from 'react';
import { PageContainer } from '../../../components/ui';

export default function APIPerformance() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-3 flex items-center text-white">
          API Performance Dashboard
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-8"></div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* Main Metrics */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800 p-6 flex-1 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Today's Metrics</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Avg Response Time</div>
                <div className="text-3xl font-bold text-white">124<span className="text-xl"> ms</span></div>
                <div className="text-green-400 text-sm mt-1">↓ 8ms from yesterday</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Availability</div>
                <div className="text-3xl font-bold text-white">99.99<span className="text-xl">%</span></div>
                <div className="text-green-400 text-sm mt-1">✓ Meeting SLA</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Error Rate</div>
                <div className="text-3xl font-bold text-white">0.07<span className="text-xl">%</span></div>
                <div className="text-green-400 text-sm mt-1">↓ 0.02% from last week</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Requests</div>
                <div className="text-3xl font-bold text-white">3.8<span className="text-xl">M</span></div>
                <div className="text-blue-400 text-sm mt-1">↑ 12% from yesterday</div>
              </div>
            </div>
          </div>
          
          {/* Traffic Distribution */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl border border-gray-800 p-6 flex-1 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Traffic by Endpoint</h2>
            
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      /tribes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      32%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "32%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      /content
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      28%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "28%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      /auth
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      18%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "18%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      /points
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      12%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "12%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"></div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold inline-block text-white">
                      /collectibles
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold inline-block text-white">
                      10%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-700">
                  <div style={{ width: "10%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* API Response Times */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg mb-10">
          <h2 className="text-xl font-semibold mb-5 text-white">API Response Times</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Endpoint</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg (ms)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">p50 (ms)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">p95 (ms)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">p99 (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/tribes/create</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">124</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">118</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">216</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">312</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/tribes/join</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">96</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">88</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">164</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">235</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/content/createPost</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">162</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">156</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">287</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">425</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/content/getTribePosts</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">142</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">135</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">256</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">368</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/auth/login</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">76</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">68</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">142</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">189</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/points/award</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">108</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">98</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">176</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">245</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">/collectibles/mint</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">196</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">186</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">312</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">462</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Geographic Distribution</h2>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">North America</div>
                </div>
                <div className="text-sm font-medium text-white">48%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Europe</div>
                </div>
                <div className="text-sm font-medium text-white">24%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Asia</div>
                </div>
                <div className="text-sm font-medium text-white">18%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">South America</div>
                </div>
                <div className="text-sm font-medium text-white">6%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Australia/Oceania</div>
                </div>
                <div className="text-sm font-medium text-white">3%</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Africa</div>
                </div>
                <div className="text-sm font-medium text-white">1%</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-5 text-white">Recent Optimizations</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm font-medium text-white">Database query optimization for content retrieval</div>
                <div className="text-xs text-gray-400 mt-1">Reduced average response time by 18%</div>
                <div className="text-xs text-gray-400">Deployed 2 days ago</div>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm font-medium text-white">Added request caching for tribe metadata</div>
                <div className="text-xs text-gray-400 mt-1">95% cache hit rate, reduced DB load by 42%</div>
                <div className="text-xs text-gray-400">Deployed 1 week ago</div>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm font-medium text-white">Improved authentication token validation</div>
                <div className="text-xs text-gray-400 mt-1">Reduced auth latency by 24%</div>
                <div className="text-xs text-gray-400">Deployed 2 weeks ago</div>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="text-sm font-medium text-white">New CDN configuration for media delivery</div>
                <div className="text-xs text-gray-400 mt-1">Global edge caching, 38% faster media loading</div>
                <div className="text-xs text-gray-400">Deployed 3 weeks ago</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error Analysis */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-5 text-white">Error Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-white">Top Error Types</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Authentication Failures (32%)</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Rate Limiting (26%)</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Invalid Parameters (18%)</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Resource Not Found (12%)</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Server Errors (8%)</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                  <div className="flex-1 text-sm text-white">Other (4%)</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 text-white">Recent Critical Errors</h3>
              <div className="space-y-4">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-400">Database Connection Timeout</div>
                  <div className="text-xs text-gray-400 mt-1">Affected 0.01% of requests</div>
                  <div className="text-xs text-gray-400">Resolved 6 hours ago</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-400">✓ All systems operational</div>
                  <div className="text-xs text-gray-400 mt-1">No active critical errors</div>
                  <div className="text-xs text-gray-400">Last incident: 6 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 