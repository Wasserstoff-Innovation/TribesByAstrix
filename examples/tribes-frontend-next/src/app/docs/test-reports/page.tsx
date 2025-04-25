"use client";

import React from 'react';
import { PageContainer } from '../../../../components/ui';

export default function TestReportsPage() {
  return (
    <PageContainer className="max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3 text-white">Test Reports</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-4"></div>
          <p className="text-gray-300 max-w-3xl">
            Comprehensive test reports for the Tribes SDK and platform components, showing test coverage 
            metrics and performance benchmarks.
          </p>
        </div>
        
        {/* Coverage Summary Card */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Test Coverage Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Unit Tests */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Unit Test Coverage</h3>
              <div className="flex items-end">
                <div className="text-4xl font-bold text-white">94%</div>
                <div className="text-green-400 ml-2 text-sm">+2.5%</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Target: 90%</span>
                  <span>1,246 tests</span>
                </div>
              </div>
            </div>
            
            {/* Integration Tests */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Integration Tests</h3>
              <div className="flex items-end">
                <div className="text-4xl font-bold text-white">87%</div>
                <div className="text-green-400 ml-2 text-sm">+1.8%</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '87%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Target: 85%</span>
                  <span>384 tests</span>
                </div>
              </div>
            </div>
            
            {/* End-to-End Tests */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">End-to-End Tests</h3>
              <div className="flex items-end">
                <div className="text-4xl font-bold text-white">79%</div>
                <div className="text-yellow-400 ml-2 text-sm">+0.5%</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: '79%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Target: 80%</span>
                  <span>92 tests</span>
                </div>
              </div>
            </div>
            
            {/* Overall Coverage */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Overall Coverage</h3>
              <div className="flex items-end">
                <div className="text-4xl font-bold text-white">92%</div>
                <div className="text-green-400 ml-2 text-sm">+1.2%</div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Target: 90%</span>
                  <span>Last run: 4h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* SDK Module Coverage */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">SDK Module Coverage</h2>
          
          <div className="space-y-6">
            {/* Auth Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Auth Module</h3>
                <span className="text-green-400 font-medium">97%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '97%' }}></div>
              </div>
            </div>
            
            {/* Tribes Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Tribes Module</h3>
                <span className="text-green-400 font-medium">96%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
            
            {/* Content Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Content Module</h3>
                <span className="text-green-400 font-medium">94%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            
            {/* Points Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Points Module</h3>
                <span className="text-yellow-400 font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
            
            {/* Profile Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Profile Module</h3>
                <span className="text-green-400 font-medium">93%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>
            
            {/* Collectibles Module */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium text-white">Collectibles Module</h3>
                <span className="text-yellow-400 font-medium">82%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Test Performance Metrics */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Performance Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Test Suite Duration</h3>
              <div className="text-3xl font-bold text-white">3m 42s</div>
              <div className="text-sm text-green-400 mt-1">-18s compared to last run</div>
              <div className="mt-4 text-sm text-gray-400">
                Full suite execution time on CI/CD pipeline
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Test Reliability</h3>
              <div className="text-3xl font-bold text-white">99.7%</div>
              <div className="text-sm text-green-400 mt-1">+0.2% compared to last run</div>
              <div className="mt-4 text-sm text-gray-400">
                Percentage of tests that consistently pass
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <h3 className="text-lg font-medium text-accent mb-2">Code Quality Score</h3>
              <div className="text-3xl font-bold text-white">A+</div>
              <div className="text-sm text-gray-400 mt-1">Same as last run</div>
              <div className="mt-4 text-sm text-gray-400">
                Based on test coverage, complexity, and maintainability
              </div>
            </div>
          </div>
        </div>
        
        {/* Latest Test Runs */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Latest Test Runs</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date/Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Branch</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Commit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Coverage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Today 10:45 AM</td>
                  <td className="py-3 px-4 text-sm text-gray-300">main</td>
                  <td className="py-3 px-4 text-sm text-accent">8f7c2d3</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">3m 42s</td>
                  <td className="py-3 px-4 text-sm text-gray-300">92%</td>
                </tr>
                <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm text-gray-300">Yesterday 5:20 PM</td>
                  <td className="py-3 px-4 text-sm text-gray-300">feature/points</td>
                  <td className="py-3 px-4 text-sm text-accent">2a9c1e5</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">4m 01s</td>
                  <td className="py-3 px-4 text-sm text-gray-300">91%</td>
                </tr>
                <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm text-gray-300">2 days ago 2:15 PM</td>
                  <td className="py-3 px-4 text-sm text-gray-300">fix/auth</td>
                  <td className="py-3 px-4 text-sm text-accent">3b4f9d2</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Failed</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">3m 58s</td>
                  <td className="py-3 px-4 text-sm text-gray-300">89%</td>
                </tr>
                <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm text-gray-300">2 days ago 11:30 AM</td>
                  <td className="py-3 px-4 text-sm text-gray-300">main</td>
                  <td className="py-3 px-4 text-sm text-accent">5e7d9b1</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">4m 10s</td>
                  <td className="py-3 px-4 text-sm text-gray-300">90%</td>
                </tr>
                <tr className="hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-sm text-gray-300">3 days ago 9:15 AM</td>
                  <td className="py-3 px-4 text-sm text-gray-300">main</td>
                  <td className="py-3 px-4 text-sm text-accent">1c9e8d7</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span></td>
                  <td className="py-3 px-4 text-sm text-gray-300">3m 55s</td>
                  <td className="py-3 px-4 text-sm text-gray-300">90%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 