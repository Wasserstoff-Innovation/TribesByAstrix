import React, { useState } from 'react';
import TribeWidget from '../../components/TribeWidget';
import SDKTester from '../../components/SDKTester';
import { Card } from '../../components/ui';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'widget' | 'sdk-tester'>('widget');

  return (
    <div className="App">
      <main className="container mx-auto px-4 py-8">
        {/* Simple tab navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`py-2 px-4 font-medium border-b-2 transition-all ${
              activeTab === 'widget' 
                ? 'border-primary text-primary' 
                : 'border-transparent hover:border-gray-300 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('widget')}
          >
            Tribe Widget
          </button>
          <button
            className={`py-2 px-4 font-medium border-b-2 transition-all ${
              activeTab === 'sdk-tester' 
                ? 'border-primary text-primary' 
                : 'border-transparent hover:border-gray-300 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('sdk-tester')}
          >
            SDK Tester
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'widget' ? (
          <div className="py-4">
            <TribeWidget onConnected={() => setConnected(true)} />
            
            {connected && (
              <div className="p-6 mt-8 text-center max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md">
                <h2 className="text-xl font-bold mb-2 text-primary">Connected to Wallet!</h2>
                <p>You can now interact with your tribe.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">
            <SDKTester onConnected={() => setConnected(true)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 