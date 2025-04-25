"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpenIcon, 
  ExclamationCircleIcon, 
  ChartBarIcon, 
  BeakerIcon, 
  CodeBracketIcon,
  PresentationChartLineIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<string>('');
  const pathname = usePathname();
  
  // Set active section based on pathname
  useEffect(() => {
    if (pathname.includes('/docs/sdk')) {
      setActiveSection('sdk');
    } else if (pathname.includes('/docs/user-flows')) {
      setActiveSection('user-flows');
    } else if (pathname.includes('/docs/error-codes')) {
      setActiveSection('error-codes');
    } else if (pathname.includes('/docs/test-reports')) {
      setActiveSection('test-reports');
    } else if (pathname.includes('/docs/api-performance')) {
      setActiveSection('api-performance');
    }
  }, [pathname]);

  const navigationItems = [
    { id: 'sdk', label: 'SDK Reference', href: '/docs/sdk', icon: CodeBracketIcon },
    { id: 'user-flows', label: 'User Flows', href: '/docs/user-flows', icon: DocumentTextIcon },
    { id: 'error-codes', label: 'Error Codes', href: '/docs/error-codes', icon: ExclamationCircleIcon },
    { id: 'test-reports', label: 'Test Reports', href: '/docs/test-reports', icon: BeakerIcon },
    { id: 'api-performance', label: 'API Performance', href: '/docs/api-performance', icon: ChartBarIcon },
  ];

  return (
    <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
} 