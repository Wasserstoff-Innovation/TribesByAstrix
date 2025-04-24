'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Navbar component with client-side only rendering
const Navbar = dynamic(() => import('../../components/Navbar'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-white shadow-sm"></div>
});

export default function NavbarWrapper() {
  return (
    <Suspense fallback={<div className="h-16 bg-white shadow-sm"></div>}>
      <Navbar />
    </Suspense>
  );
} 