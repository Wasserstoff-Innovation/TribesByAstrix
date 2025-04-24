'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { Dropdown } from './ui';

// Supported networks configuration
const SUPPORTED_NETWORKS = [
  { 
    id: 'xdc-mainnet', 
    name: 'XDC Mainnet', 
    icon: 'X', 
    color: 'bg-blue-600'
  },
  { 
    id: 'xdc-testnet', 
    name: 'XDC Apothem Testnet', 
    icon: 'X',
    color: 'bg-blue-400'
  },
  { 
    id: 'monad-testnet', 
    name: 'Monad Testnet', 
    icon: 'M',
    color: 'bg-purple-500'
  },
  { 
    id: 'fuse-testnet', 
    name: 'Fuse Testnet', 
    icon: 'F',
    color: 'bg-orange-500'
  },
  { 
    id: 'manta-testnet', 
    name: 'Manta Testnet', 
    icon: 'M',
    color: 'bg-blue-500'
  }
];

export default function Navbar() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);
  
  const isActive = (path: string, exact: boolean = true) => {
    if (exact) {
      return pathname === path;
    } else {
      // Check if the current path starts with the given path (for parent links)
      return pathname.startsWith(path);
    }
  };

  const baseLinkClasses = "px-2 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-input-dark text-foreground-dark";
  const inactiveLinkClasses = "text-muted-foreground hover:bg-input-dark";

  // Generate network dropdown items
  const networkItems = SUPPORTED_NETWORKS.map(network => ({
    label: (
      <div className="flex items-center">
        <div className={`w-5 h-5 rounded-full ${network.color} flex items-center justify-center text-white mr-2 text-xs font-bold`}>
          {network.icon}
        </div>
        <span>{network.name}</span>
      </div>
    ),
    onClick: () => setSelectedNetwork(network),
    isActive: selectedNetwork.id === network.id
  }));

  return (
    <header className="bg-background-dark shadow-sm fixed top-0 left-0 right-0 w-full z-50">
      <div className="container mx-auto px-2 lg:px-3">
        <div className="flex justify-between items-center h-16">
          {/* Logo with * and subtext - removed extra padding */}
          <div className="flex-shrink-0 pl-0">
            <Link href="/" className="flex flex-col items-start">
              <span className="text-xl font-bold text-foreground-dark">
                <span className="text-accent">*</span>Tribes
              </span>
              <span className="text-xs text-muted-foreground -mt-1">by Astrix</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center ml-6 flex-1">
            <div className="flex items-center space-x-2">
              <Link 
                href="/" 
                className={`${baseLinkClasses} ${isActive('/') ? activeLinkClasses : inactiveLinkClasses}`}
              >
                Home
              </Link>
              <Link 
                href="/tribes" 
                className={`${baseLinkClasses} ${isActive('/tribes') ? activeLinkClasses : inactiveLinkClasses}`}
              >
                Tribes
              </Link>
              <Link 
                href="/feed" 
                className={`${baseLinkClasses} ${isActive('/feed') ? activeLinkClasses : inactiveLinkClasses}`}
              >
                Feeds
              </Link>
              <Link 
                href="/docs" 
                className={`${baseLinkClasses} ${isActive('/docs', false) && !pathname.startsWith('/docs/sdk-tester') ? activeLinkClasses : inactiveLinkClasses}`}
              >
                Documentation
              </Link>
            </div>
            
            <div className="flex items-center ml-auto space-x-3">
              {/* Help Button */}
              <button className="px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-input-dark transition-colors">
                <span className="flex items-center">
                  <span className="h-5 w-5 flex items-center justify-center rounded-full border border-muted-foreground mr-1">?</span>
                </span>
              </button>

              {/* Network Selection Dropdown */}
              <div>
                <Dropdown
                  trigger={
                    <button className="flex items-center px-2 py-2 rounded-md border border-gray-700 bg-card-dark hover:bg-input-dark transition-colors">
                      <div className={`w-5 h-5 rounded-full ${selectedNetwork.color} flex items-center justify-center text-white mr-2 text-xs font-bold`}>
                        {selectedNetwork.icon}
                      </div>
                      <span className="text-sm font-medium text-foreground-dark">{selectedNetwork.name}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </button>
                  }
                  items={networkItems}
                  align="right"
                  width={220}
                />
              </div>

              {/* Notification icon */}
              <button className="p-2 text-muted-foreground hover:bg-input-dark rounded-full transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-input-dark">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 