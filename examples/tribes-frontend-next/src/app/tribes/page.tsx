'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components with client-side rendering
const TribesListPage = dynamic(() => import('../../../components/TribesListPage'), { 
  ssr: false,
  loading: () => <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>
});

export default function TribesPage() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [sdk, setSdk] = useState<any>(null);
  
  const handleConnect = async () => {
    // This is just a stub - the actual connection is handled in the TribesListPage component
    try {
      setConnected(true);
      return Promise.resolve();
    } catch (error) {
      console.error('Connection error:', error);
      return Promise.reject(error);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <TribesListPage 
        isConnected={connected}
        account={account}
        sdk={sdk}
        onConnect={handleConnect}
      />
    </div>
  );
} 