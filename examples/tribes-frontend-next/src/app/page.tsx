'use client';

import dynamic from 'next/dynamic';
import { PageContainer } from '../../components/ui';

// Dynamically import component with no SSR to avoid window not defined errors
const SDKTester = dynamic(() => import('../../components/SDKTester'), { ssr: false });

export default function Home() {
  return (
    <PageContainer className="max-w-7xl">
      <SDKTester onConnected={() => console.log('Connected to SDK')} />
    </PageContainer>
  );
}
