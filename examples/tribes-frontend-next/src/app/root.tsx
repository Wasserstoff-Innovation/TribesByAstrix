'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';

// This is a client-side wrapper component to safely handle any browser API usage
export default function RootClient({ children }: { children: React.ReactNode }) {
  // Use this state to prevent hydration errors by only rendering when mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true on client-side
    setMounted(true);
  }, []);

  // This ensures the component only renders once mounted on the client
  // preventing document/window API calls during server rendering
  if (!mounted) {
    // Return a minimal version that matches the structure but doesn't use browser APIs
    return <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  );
} 