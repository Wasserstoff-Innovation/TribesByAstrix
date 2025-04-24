'use client';

import { useEffect, useState } from 'react';
import { getDefaultNetwork, NetworkConfig, getNetworkByChainId } from '../src/app/config/contracts';

// Define the TribesSDK interface based on usage
interface TribesSDK {
  init: () => Promise<void>;
  posts: {
    getLatestPosts: (tribeId: bigint, limit: number, offset: number) => Promise<any[]>;
  };
  // Add other SDK methods as needed
}

interface TribesSDKState {
  sdk: TribesSDK | null;
  initialized: boolean;
  loading: boolean;
  error: Error | null;
  currentNetwork: NetworkConfig | null;
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

export function useTribesSDK() {
  const [state, setState] = useState<TribesSDKState>({
    sdk: null,
    initialized: false,
    loading: true,
    error: null,
    currentNetwork: getDefaultNetwork()
  });

  useEffect(() => {
    let mounted = true;
    const initSDK = async () => {
      try {
        // Use the default network if not connected to a wallet
        const defaultNetwork = getDefaultNetwork();
        
        // Check if ethereum is available (MetaMask or other wallet)
        let currentChainId = defaultNetwork.chainId;
        let userNetwork = defaultNetwork;
        
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            // Get the current chain ID from the connected wallet
            const chainIdHex = await window.ethereum.request({ 
              method: 'eth_chainId' 
            });
            currentChainId = parseInt(chainIdHex, 16);
            
            // Find network config for this chain ID
            const networkConfig = getNetworkByChainId(currentChainId);
            if (networkConfig) {
              userNetwork = networkConfig;
            }
          } catch (walletError) {
            console.warn('Could not connect to wallet, using default network', walletError);
          }
        }
        
        // Dynamic import of the SDK to avoid build issues
        const { default: TribesSDKClass } = await import('../../../sdk/dist');
        
        // Initialize the TribesSDK with the appropriate network
        const sdk = new TribesSDKClass({
          rpcUrl: userNetwork.rpcUrl,
          chainId: userNetwork.chainId
        });
        
        await sdk.init();
        
        if (mounted) {
          setState({
            sdk,
            initialized: true,
            loading: false,
            error: null,
            currentNetwork: userNetwork
          });
        }
      } catch (error) {
        console.error('SDK initialization error:', error);
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error('Failed to initialize SDK')
          }));
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
} 