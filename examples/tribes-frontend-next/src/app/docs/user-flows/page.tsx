"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { userFlows } from '../data/user-flows';
import { PageContainer } from '../../../../components/ui';

// Main User Flows Page Component
export default function UserFlowsPage() {
  const [activeTab, setActiveTab] = useState('onboarding');
  
  // Flow type definitions
  const flowTypes = [
    { id: 'onboarding', label: 'User Onboarding' },
    { id: 'tribes', label: 'Tribe Management' },
    { id: 'content', label: 'Content Creation' },
    { id: 'rewards', label: 'Rewards & Points' }
  ];
  
  const categories = userFlows.map(flow => flow.category);
  const uniqueCategories = Array.from(new Set(categories));

  return (
    <PageContainer className="max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3 text-white">User Flows</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-accent to-accent/70 rounded-full mb-4"></div>
          <p className="text-gray-300 max-w-3xl">
            Explore how users interact with the Tribes platform. These diagrams help visualize 
            the user journey and provide guidance for implementing common features.
          </p>
        </div>

        {/* Flow Navigation */}
        <div className="flex overflow-x-auto pb-2 mb-6 hide-scrollbar">
          <div className="flex space-x-2">
            {flowTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`px-4 py-2 whitespace-nowrap font-medium rounded-md transition-colors ${
                  activeTab === type.id 
                    ? 'bg-accent text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Content Area */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          {activeTab === 'onboarding' && (
            <OnboardingContent />
          )}
          
          {activeTab === 'tribes' && (
            <TribesContent />
          )}
          
          {activeTab === 'content' && (
            <ContentContent />
          )}
          
          {activeTab === 'rewards' && (
            <RewardsContent />
          )}
        </div>
        
        {/* Integration Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Integration Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {uniqueCategories.map((category, index) => {
              // Get a sample flow from this category
              const sampleFlow = userFlows.find(flow => flow.category === category);
              if (!sampleFlow) return null;
              
              return (
                <IntegrationCard 
                  key={index} 
                  title={category} 
                  description={sampleFlow.description}
                  difficulty={sampleFlow.complexity}
                  flowId={sampleFlow.id}
                />
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// Integration Card Component
const IntegrationCard = ({ 
  title, 
  description, 
  difficulty, 
  flowId 
}: { 
  title: string;
  description: string;
  difficulty: string;
  flowId: string;
}) => {
  const difficultyColor = 
    difficulty === 'Simple' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 
    difficulty === 'Moderate' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : 
    'text-red-400 border-red-500/30 bg-red-500/10';
    
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-5 hover:bg-gray-900/80 transition group">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColor}`}>
          {difficulty}
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{description}</p>
      <button
        onClick={() => {
          const element = document.getElementById(flowId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="text-accent text-sm hover:text-accent/80 flex items-center group-hover:translate-x-1 transition-transform"
      >
        View Flow
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Onboarding Flow Content Component
const OnboardingContent = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-white">User Onboarding Flow</h2>
    <p className="text-gray-300 mb-8">
      The process of connecting a wallet, creating a profile, and joining a tribe.
    </p>
    
    <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
      <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Auth as Authentication
    participant Profile as User Profile
    
    User->>App: Visit application
    App->>User: Display connect wallet prompt
    User->>App: Click "Connect Wallet"
    App->>SDK: sdk.connect(signer)
    SDK->>Auth: Verify wallet
    Auth-->>SDK: Wallet connected
    SDK-->>App: Connection successful
    App->>User: Display profile creation form
    
    User->>App: Enter profile information
    App->>SDK: sdk.profile.createProfile()
    SDK->>Profile: Store profile data
    Profile-->>SDK: Profile created
    SDK-->>App: Return profile data
    App->>User: Display success & tribe recommendations`}
      </pre>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-white mb-3">1. Wallet Connection</h3>
        <p className="text-gray-300 text-sm">User connects their wallet to the application</p>
        <div className="mt-4 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400">Key SDK Methods:</p>
          <ul className="text-sm text-accent mt-2 space-y-1">
            <li>sdk.connect(signer)</li>
            <li>sdk.isConnected()</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-white mb-3">2. Profile Creation</h3>
        <p className="text-gray-300 text-sm">User creates their profile with username and details</p>
        <div className="mt-4 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400">Key SDK Methods:</p>
          <ul className="text-sm text-accent mt-2 space-y-1">
            <li>sdk.profile.createProfile()</li>
            <li>sdk.profile.updateProfile()</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-white mb-3">3. Tribe Discovery</h3>
        <p className="text-gray-300 text-sm">User discovers and joins their first tribe</p>
        <div className="mt-4 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400">Key SDK Methods:</p>
          <ul className="text-sm text-accent mt-2 space-y-1">
            <li>sdk.tribes.getAllTribes()</li>
            <li>sdk.tribes.joinTribe()</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// Tribes Flow Content Component
const TribesContent = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-white">Tribe Management Flow</h2>
    <p className="text-gray-300 mb-8">
      Flows for creating, joining, and managing tribes within the platform.
    </p>
    
    {/* Content for Tribes flows would go here */}
    <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
      <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Contract as Tribe Contract
    
    User->>App: Select "Create Tribe"
    App->>User: Display tribe creation form
    User->>App: Enter tribe name, description, settings
    App->>SDK: sdk.tribes.createTribe()
    SDK->>Contract: Deploy new tribe
    Contract-->>SDK: Return tribe ID
    SDK-->>App: Return tribe details
    App->>User: Display success & tribe dashboard`}
      </pre>
    </div>
  </div>
);

// Content Flow Content Component
const ContentContent = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-white">Content Creation Flow</h2>
    <p className="text-gray-300 mb-8">
      Flows for creating and interacting with content in tribes.
    </p>
    
    {/* Content for Content flows would go here */}
    <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
      <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Storage as Content Storage
    participant Contract as Content Contract
    
    User->>App: Create new post
    App->>User: Display content editor
    User->>App: Submit post content
    App->>SDK: sdk.content.createPost()
    SDK->>Storage: Store content data
    Storage-->>SDK: Return content CID
    SDK->>Contract: Record content on-chain
    Contract-->>SDK: Return transaction result
    SDK-->>App: Return post data
    App->>User: Display success & new post`}
      </pre>
    </div>
  </div>
);

// Rewards Flow Content Component
const RewardsContent = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-6 text-white">Rewards & Points Flow</h2>
    <p className="text-gray-300 mb-8">
      Flows for earning, distributing, and managing points and rewards.
    </p>
    
    {/* Content for Rewards flows would go here */}
    <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 overflow-auto">
      <pre className="text-sm text-gray-300 whitespace-pre">
{`sequenceDiagram
    actor User
    participant App as Web App
    participant SDK as Tribes SDK
    participant Points as Points System
    participant Contract as Rewards Contract
    
    User->>App: Complete reward-eligible action
    App->>SDK: sdk.points.awardPoints()
    SDK->>Points: Calculate points earned
    Points->>Contract: Record points on-chain
    Contract-->>Points: Confirm points awarded
    Points-->>SDK: Return updated points balance
    SDK-->>App: Return points data
    App->>User: Display points earned notification`}
      </pre>
    </div>
  </div>
); 