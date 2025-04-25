"use client";

import React, { useState } from 'react';
import { PageContainer } from '../../../components/ui';
import { errorCodes, ErrorCode } from './data/error-codes';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Extract possible error categories from the error codes
const getErrorCategory = (error: ErrorCode): string => {
  if (error.code.startsWith("COMMON")) return "Common";
  if (error.code.startsWith("TRIBE")) return "Tribe";
  if (error.code.startsWith("POST")) return "Content";
  if (error.code.startsWith("COLLECTIBLE")) return "Collectible";
  if (error.code.startsWith("SDK")) return "SDK";
  if (error.code.startsWith("NETWORK")) return "Network";
  if (error.code.startsWith("AUTH")) return "Authentication";
  if (error.code.startsWith("CONTRACT")) return "Contract";
  return "Other";
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case "Authentication":
      return "bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50";
    case "Tribe":
      return "bg-amber-900/30 text-amber-400 border border-amber-800/50 hover:bg-amber-900/50";
    case "Content":
      return "bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/50";
    case "Collectible":
      return "bg-purple-900/30 text-purple-400 border border-purple-800/50 hover:bg-purple-900/50";
    case "Contract":
      return "bg-rose-900/30 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50";
    case "Network":
      return "bg-orange-900/30 text-orange-400 border border-orange-800/50 hover:bg-orange-900/50";
    case "SDK":
      return "bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/50";
    case "Common":
      return "bg-teal-900/30 text-teal-400 border border-teal-800/50 hover:bg-teal-900/50";
    default:
      return "bg-gray-900/30 text-gray-400 border border-gray-800/50 hover:bg-gray-900/50";
  }
};

const ErrorCodesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get all unique categories
  const categories = [...new Set(errorCodes.map(error => getErrorCategory(error)))];
  
  // Filter errors based on selected category
  const filteredErrors = selectedCategory 
    ? errorCodes.filter(error => getErrorCategory(error) === selectedCategory)
    : errorCodes;
  
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 text-white flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 mr-3 text-amber-400" />
          Error Codes
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-6"></div>
        <p className="text-lg text-gray-300 max-w-3xl">
          The Tribes SDK uses the following error codes to indicate specific issues that might occur during operations.
          This reference helps you troubleshoot problems and implement appropriate error handling in your application.
        </p>
      </div>
      
      {/* Quick filter by category */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Filter by Category</h2>
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <div 
              key="all"
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors bg-accent/20 text-accent border border-accent/50 hover:bg-accent/30"
            >
              Clear Filter
            </div>
          )}
          {categories.map(category => (
            <div 
              key={category} 
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors
                ${category === selectedCategory ? 'bg-accent/20 text-accent border border-accent/50' : getCategoryColor(category)}`}
            >
              {category}
            </div>
          ))}
        </div>
      </div>
      
      {/* Error codes list */}
      <div className="space-y-4">
        {filteredErrors.map((error, index) => {
          const category = getErrorCategory(error);
          return (
            <div key={index} className="bg-black/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center">
                  <span className="font-mono text-lg font-bold text-white mr-3">{error.code}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                </div>
                <div className="font-mono text-sm px-3 py-1.5 bg-gray-800/50 rounded-md text-accent">{error.message}</div>
              </div>
              
              <p className="text-gray-300 mb-4">{error.description}</p>
              
              {error.possibleSolutions && error.possibleSolutions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Possible Solutions:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    {error.possibleSolutions.map((solution, i) => (
                      <li key={i}>{solution}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Best practices */}
      <div className="mt-12 bg-black/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Error Handling Best Practices</h2>
        <div className="space-y-4 text-gray-300">
          <p>When integrating the Tribes SDK, we recommend the following error handling approaches:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Always wrap SDK calls in try/catch blocks to handle potential errors gracefully.</li>
            <li>Check the error code to provide specific user feedback rather than generic error messages.</li>
            <li>Implement retry logic for network-related errors that might be temporary.</li>
            <li>Log errors on your server for monitoring and debugging purposes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorCodesPage; 