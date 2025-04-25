'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PageContainer } from '../../../components/ui/PageContainer';

// Import the FeedContent component dynamically with no SSR
const FeedContent = dynamic(() => import('./FeedContent'), { ssr: false });

// Simple loader component for client-side loading
function Loader() {
  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading  feed...</p>
        </div>
      </div>
    </PageContainer>
  );
}

export default function FeedPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Loader />;
  }

  return <FeedContent />;
} 