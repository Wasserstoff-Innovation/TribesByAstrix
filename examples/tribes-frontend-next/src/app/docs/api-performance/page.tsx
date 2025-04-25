"use client";

import React, { useState } from 'react';
import { PageContainer } from '../../../../components/ui';

// Simulated API performance data
const apiPerformanceData = {
  // Endpoints by module
  endpoints: [
    {
      module: 'Auth',
      methods: [
        { name: 'connect', avgResponse: 105, p95: 180, p99: 220, success: 99.8, calls: 24596 },
        { name: 'verify', avgResponse: 95, p95: 145, p99: 190, success: 99.9, calls: 22145 },
        { name: 'disconnect', avgResponse: 40, p95: 60, p99: 85, success: 100, calls: 15782 }
      ]
    },
    {
      module: 'Tribes',
      methods: [
        { name: 'createTribe', avgResponse: 850, p95: 1200, p99: 1450, success: 99.2, calls: 4532 },
        { name: 'getTribe', avgResponse: 120, p95: 200, p99: 280, success: 99.9, calls: 18762 },
        { name: 'getAllTribes', avgResponse: 350, p95: 620, p99: 780, success: 99.7, calls: 12453 },
        { name: 'joinTribe', avgResponse: 750, p95: 980, p99: 1350, success: 98.8, calls: 8954 },
        { name: 'leaveTribe', avgResponse: 680, p95: 860, p99: 1050, success: 99.3, calls: 2135 }
      ]
    },
    {
      module: 'Content',
      methods: [
        { name: 'createPost', avgResponse: 580, p95: 780, p99: 950, success: 99.1, calls: 15678 },
        { name: 'getTribePosts', avgResponse: 280, p95: 450, p99: 580, success: 99.8, calls: 56789 },
        { name: 'getPost', avgResponse: 90, p95: 150, p99: 210, success: 99.9, calls: 48752 },
        { name: 'commentOnPost', avgResponse: 320, p95: 480, p99: 590, success: 99.5, calls: 12567 },
        { name: 'reactToPost', avgResponse: 190, p95: 290, p99: 380, success: 99.7, calls: 35684 }
      ]
    },
    {
      module: 'Points',
      methods: [
        { name: 'awardPoints', avgResponse: 480, p95: 680, p99: 850, success: 99.2, calls: 8976 },
        { name: 'getPoints', avgResponse: 110, p95: 180, p99: 230, success: 99.9, calls: 23567 },
        { name: 'transferPoints', avgResponse: 530, p95: 730, p99: 890, success: 98.9, calls: 3456 }
      ]
    },
    {
      module: 'Collectibles',
      methods: [
        { name: 'createCollectible', avgResponse: 920, p95: 1450, p99: 1780, success: 98.5, calls: 2345 },
        { name: 'mintCollectible', avgResponse: 780, p95: 1100, p99: 1350, success: 98.8, calls: 5678 },
        { name: 'getCollectibles', avgResponse: 180, p95: 270, p99: 350, success: 99.7, calls: 15623 }
      ]
    }
  ],
  // Historical performance data
  history: [
    { date: 'Last 24h', avg: 265, p95: 520, success: 99.6, rps: 45.6 },
    { date: '2 days ago', avg: 278, p95: 545, success: 99.4, rps: 43.2 },
    { date: '3 days ago', avg: 295, p95: 560, success: 99.3, rps: 41.8 },
    { date: '4 days ago', avg: 270, p95: 530, success: 99.5, rps: 42.5 },
    { date: '5 days ago', avg: 285, p95: 550, success: 99.5, rps: 40.3 },
    { date: '6 days ago', avg: 302, p95: 580, success: 99.2, rps: 38.7 },
    { date: '7 days ago', avg: 288, p95: 555, success: 99.3, rps: 39.5 }
  ],
  // Month over month changes
  monthly: [
    { month: 'Current', avg: 275, calls: 835620, success: 99.6 },
    { month: 'Last Month', avg: 295, calls: 798450, success: 99.4 },
    { month: '2 Months Ago', avg: 320, calls: 745780, success: 99.2 }
  ]
};

export default function ApiPerformancePage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <PageContainer className="max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3 text-white">API Performance</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-4"></div>
          <p className="text-gray-300 max-w-3xl">
            Performance metrics for the Tribes API showing response times, success rates, and usage trends.
            This data helps monitor platform health and identify optimization opportunities.
          </p>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto pb-2 mb-6 hide-scrollbar">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 whitespace-nowrap font-medium rounded-md transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-accent text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-4 py-2 whitespace-nowrap font-medium rounded-md transition-colors ${
                activeTab === 'endpoints' 
                  ? 'bg-accent text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Endpoint Details
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 whitespace-nowrap font-medium rounded-md transition-colors ${
                activeTab === 'trends' 
                  ? 'bg-accent text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Historical Trends
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          {activeTab === 'overview' && (
            <OverviewContent data={apiPerformanceData} />
          )}
          
          {activeTab === 'endpoints' && (
            <EndpointContent data={apiPerformanceData} />
          )}
          
          {activeTab === 'trends' && (
            <TrendsContent data={apiPerformanceData} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

// Overview Content Component
const OverviewContent = ({ data }: { data: any }) => {
  // Calculate overall statistics
  const allMethods = data.endpoints.flatMap((endpoint: any) => endpoint.methods);
  const avgResponseTime = Math.round(allMethods.reduce((acc: number, method: any) => acc + method.avgResponse, 0) / allMethods.length);
  const totalCalls = allMethods.reduce((acc: number, method: any) => acc + method.calls, 0);
  const avgSuccessRate = parseFloat((allMethods.reduce((acc: number, method: any) => acc + method.success, 0) / allMethods.length).toFixed(2));
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8 text-white">Performance Overview</h2>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-medium text-accent mb-2">Avg Response Time</h3>
          <div className="flex items-end">
            <div className="text-4xl font-bold text-white">{avgResponseTime}</div>
            <div className="text-gray-400 ml-2 text-sm">ms</div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Average across all endpoints
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-medium text-accent mb-2">Success Rate</h3>
          <div className="flex items-end">
            <div className="text-4xl font-bold text-white">{avgSuccessRate}%</div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Successful API calls ratio
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-medium text-accent mb-2">Total API Calls</h3>
          <div className="flex items-end">
            <div className="text-4xl font-bold text-white">{(totalCalls / 1000).toFixed(1)}K</div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Last 30 days
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-medium text-accent mb-2">Peak RPS</h3>
          <div className="flex items-end">
            <div className="text-4xl font-bold text-white">67.8</div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Requests per second (max)
          </div>
        </div>
      </div>
      
      {/* Month over Month Comparison */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-white">Month over Month</h3>
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Avg Response</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">API Calls</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Success Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Change</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((month: any, index: number) => {
                const prevMonth = data.monthly[index + 1];
                const responseChange = prevMonth ? ((prevMonth.avg - month.avg) / prevMonth.avg * 100).toFixed(1) : '-';
                const callsChange = prevMonth ? ((month.calls - prevMonth.calls) / prevMonth.calls * 100).toFixed(1) : '-';
                
                return (
                  <tr key={month.month} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-300">{month.month}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{month.avg} ms</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{(month.calls / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{month.success}%</td>
                    <td className="px-4 py-3 text-sm">
                      {prevMonth && (
                        <div className="flex items-center">
                          <span className={responseChange.startsWith('-') ? 'text-green-400' : 'text-yellow-400'}>
                            {responseChange.startsWith('-') ? '↓' : '↑'} {Math.abs(parseFloat(responseChange))}% response time
                          </span>
                          <span className="mx-1 text-gray-500">|</span>
                          <span className={callsChange.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
                            {callsChange.startsWith('-') ? '↓' : '↑'} {Math.abs(parseFloat(callsChange))}% calls
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Top 5 Slowest Endpoints */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">Top 5 Slowest Endpoints</h3>
        <div className="grid grid-cols-1 gap-4">
          {allMethods
            .sort((a: any, b: any) => b.avgResponse - a.avgResponse)
            .slice(0, 5)
            .map((method: any, index: number) => {
              const endpoint = data.endpoints.find((ep: any) => ep.methods.some((m: any) => m.name === method.name))?.module;
              return (
                <div key={index} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="text-accent font-mono">{endpoint}.</span>
                      <span className="text-white font-mono">{method.name}()</span>
                    </div>
                    <div className="text-white font-semibold">{method.avgResponse} ms</div>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${Math.min(100, (method.avgResponse / 1000) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>p95: {method.p95} ms</span>
                    <span>p99: {method.p99} ms</span>
                    <span>Success Rate: {method.success}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Endpoint Details Component
const EndpointContent = ({ data }: { data: any }) => {
  const [selectedModule, setSelectedModule] = useState('all');
  
  // Filter methods based on selected module
  const filteredEndpoints = selectedModule === 'all' 
    ? data.endpoints 
    : data.endpoints.filter((endpoint: any) => endpoint.module === selectedModule);
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-white">Endpoint Performance</h2>
      
      {/* Module Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedModule('all')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedModule === 'all' 
                ? 'bg-accent/20 text-accent' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Modules
          </button>
          {data.endpoints.map((endpoint: any) => (
            <button
              key={endpoint.module}
              onClick={() => setSelectedModule(endpoint.module)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedModule === endpoint.module 
                  ? 'bg-accent/20 text-accent' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {endpoint.module}
            </button>
          ))}
        </div>
      </div>
      
      {/* Endpoints Table */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/80">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Endpoint</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Avg Response</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">p95</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">p99</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Success Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Call Volume</th>
            </tr>
          </thead>
          <tbody>
            {filteredEndpoints.flatMap((endpoint: any) => 
              endpoint.methods.map((method: any, methodIndex: number) => (
                <tr key={`${endpoint.module}-${method.name}`} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-white">{method.name}()</div>
                    <div className="text-xs text-gray-400">{endpoint.module} Module</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      method.avgResponse < 200 ? 'text-green-400' : 
                      method.avgResponse < 500 ? 'text-yellow-400' : 'text-orange-400'
                    }`}>{method.avgResponse} ms</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{method.p95} ms</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{method.p99} ms</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      method.success >= 99.5 ? 'text-green-400' : 
                      method.success >= 98 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{method.success}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{method.calls.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Historical Trends Component
const TrendsContent = ({ data }: { data: any }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-8 text-white">Historical Performance</h2>
      
      {/* 7-Day Chart */}
      <div className="mb-10">
        <h3 className="text-xl font-medium mb-4 text-white">7-Day Performance Trend</h3>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          {/* Simple chart visualization */}
          <div className="h-64 flex items-end justify-between">
            {data.history.map((day: any, index: number) => {
              const avgHeight = `${(day.avg / 400) * 100}%`;
              const p95Height = `${(day.p95 / 600) * 100}%`;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="relative w-full max-w-[40px] flex flex-col items-center">
                    {/* p95 Bar */}
                    <div 
                      className="w-3 bg-amber-500/50 rounded-t"
                      style={{ height: p95Height }}
                    ></div>
                    
                    {/* Avg Bar */}
                    <div 
                      className="w-8 bg-blue-500 rounded-t absolute bottom-0"
                      style={{ height: avgHeight }}
                    ></div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">{day.date}</div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
              <span className="text-sm text-gray-300">Avg Response Time</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500/50 rounded-sm mr-2"></div>
              <span className="text-sm text-gray-300">p95 Response Time</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed 7-Day Data */}
      <div>
        <h3 className="text-xl font-medium mb-4 text-white">Daily Performance Details</h3>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Avg Response</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">p95 Response</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Success Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Peak RPS</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((day: any, index: number) => (
                <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-sm font-medium text-white">{day.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{day.avg} ms</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{day.p95} ms</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{day.success}%</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{day.rps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 