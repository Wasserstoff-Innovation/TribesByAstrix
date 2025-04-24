import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider } from 'ethers';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Button, Card } from './ui';
import { useToasts } from './ui/Toast';
import { getDefaultNetwork } from '../src/app/config/contracts';

// Add global ethereum declaration
declare global {
  interface Window {
    ethereum: any;
  }
}

// Types for tribe data
interface TribeInfo {
  id: number;
  name: string;
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  exchangeRate?: number;
  actionPoints?: Record<string, number>;
}

interface MemberPoints {
  address: string;
  points: number;
}

interface TribeWidgetProps {
  onConnected?: () => void;
}

const TribeWidget: React.FC<TribeWidgetProps> = ({ onConnected }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [sdk, setSdk] = useState<AstrixSDK | null>(null);
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToasts();

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request account access
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Get network configuration
        const networkConfig = getDefaultNetwork();
        
        console.log("Network config:", networkConfig);
        console.log("Using contract addresses:", networkConfig.contracts);
        
        try {
          // Initialize SDK with properly formatted contract addresses and provider
          const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
          
          const tribesSDK = new AstrixSDK({
            provider: jsonRpcProvider,
            chainId: networkConfig.chainId,
            contracts: {
              roleManager: networkConfig.contracts.roleManager,
              tribeController: networkConfig.contracts.tribeController,
              astrixToken: networkConfig.contracts.astrixToken,
              tokenDispenser: networkConfig.contracts.tokenDispenser,
              astrixPointSystem: networkConfig.contracts.astrixPointSystem,
              profileNFTMinter: networkConfig.contracts.profileNFTMinter || '',
              // Add required missing fields with empty strings
              collectibleController: '',
              postMinter: '',
              postFeedManager: ''
            },
            verbose: true
          });
          
          console.log("SDK initialized successfully");
          
          // Connect with signer
          await tribesSDK.connect(signer);
          console.log("SDK connected with signer");
          
          setAccount(address);
          setSdk(tribesSDK);
          
          showToast({
            type: 'success',
            title: 'Connected',
            message: 'SDK initialized and connected with wallet',
            duration: 3000
          });
          
          if (onConnected) {
            onConnected();
          }
          
          // Fetch tribes
          fetchTribes(tribesSDK);
        } catch (error) {
          console.error('Error initializing or connecting SDK:', error);
          const errorMessage = `Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`;
          setError(errorMessage);
          
          showToast({
            type: 'error',
            title: 'SDK Initialization Failed',
            message: errorMessage,
            duration: 5000
          });
        }
      } else {
        const errorMessage = 'Ethereum wallet not detected. Please install MetaMask or another compatible wallet.';
        setError(errorMessage);
        
        showToast({
          type: 'error',
          title: 'Wallet Not Detected',
          message: errorMessage,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      const errorMessage = `Failed to connect wallet: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTribes = async (tribesSDK: AstrixSDK) => {
    try {
      setLoading(true);
      
      // Use the tribes module to get tribe information
      const tribesList = await tribesSDK.tribes.getAllTribes();
      console.log("Fetched tribes:", tribesList);
      setTribes(tribesList.tribeIds);
      
      showToast({
        type: 'info',
        title: 'Tribes Loaded',
        message: `Found ${tribesList.tribeIds.length} tribes for your account`,
        duration: 3000
      });
    } catch (err) {
      console.error('Error fetching tribes:', err);
      const errorMessage = `Failed to fetch tribes: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      
      showToast({
        type: 'error',
        title: 'Error Loading Tribes',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Add event listener for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          setAccount(null);
          setSdk(null);
          setTribes([]);
          
          showToast({
            type: 'info',
            title: 'Disconnected',
            message: 'Wallet has been disconnected',
            duration: 3000
          });
        } else if (account && accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          
          showToast({
            type: 'success',
            title: 'Account Changed',
            message: 'Connected to a different account',
            duration: 3000
          });
          
          // Re-fetch tribes with new account if SDK is already initialized
          if (sdk) {
            fetchTribes(sdk);
          }
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [account, sdk]);

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Tribe Widget</h2>
      
      {!account ? (
        <Button 
          variant="primary"
          size="lg"
          onClick={connectWallet}
          isLoading={loading}
          fullWidth
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : (
        <div className="connected-account space-y-4">
          <Card variant="outlined" className="p-4">
            <p className="text-sm"><strong>Connected Account:</strong> {account}</p>
          </Card>
          
          {tribes.length > 0 ? (
            <div className="tribes-list mt-4">
              <h3 className="text-lg font-semibold mb-2">Your Tribes</h3>
              <div className="space-y-2">
                {tribes.map((tribe, index) => (
                  <Card key={index} variant="flat" className="p-3">
                    {tribe.name} (ID: {tribe.id})
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card variant="flat" className="p-4 text-center text-gray-500">
              No tribes found. Connect with a different wallet or create a new tribe.
            </Card>
          )}
        </div>
      )}
      
      {error && (
        <Card variant="outlined" className="p-4 mt-4 border-red-300 bg-red-50 text-red-800">
          {error}
        </Card>
      )}
    </Card>
  );
};

export default TribeWidget; 