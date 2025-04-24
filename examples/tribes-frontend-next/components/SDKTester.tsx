import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { 
  Card, CardHeader, CardTitle, CardContent, CardFooter, 
  Button, Input, Badge, Modal, Select
} from './ui';
import { getDefaultNetwork } from '../src/app/config/contracts';
import { useToasts, Toast, ToastContainer } from './ui/Toast';

// Type definitions
interface SDKMethod {
  module: string;
  method: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  isWrite: boolean; // Indicates if this is a write method (requires transaction)
}

// Metadata form interface
interface TribeMetadataForm {
  description: string;
  logoUrl: string;
  bannerUrl: string;
  website: string;
  twitter: string;
  discord: string;
}

// SDK methods we want to test - use this to automatically generate UI
const SDK_METHODS: SDKMethod[] = [
  // Tribes Module
  {
    module: 'tribes',
    method: 'createTribe',
    description: 'Create a new tribe',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Name of the tribe' },
      { name: 'metadata', type: 'string', required: false, description: 'JSON metadata for the tribe' },
      { name: 'joinType', type: 'number', required: false, description: 'Type of join policy (0=Public, 1=Private, 2=Invite)' }
    ],
    isWrite: true
  },
  {
    module: 'tribes',
    method: 'getAllTribes',
    description: 'Get all tribes',
    parameters: [],
    isWrite: false
  },
  {
    module: 'tribes',
    method: 'getTribeDetails',
    description: 'Get details of a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  {
    module: 'tribes',
    method: 'getMembers',
    description: 'Get members of a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  {
    module: 'tribes',
    method: 'joinTribe',
    description: 'Join a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: true
  },
  {
    module: 'tribes',
    method: 'leaveTribe',
    description: 'Leave a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: true
  },
  {
    module: 'tribes',
    method: 'getMemberStatus',
    description: 'Check membership status in a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'address', type: 'string', required: true, description: 'Address to check' }
    ],
    isWrite: false
  },
  {
    module: 'tribes',
    method: 'getTribesForMember',
    description: 'Get all tribes a member belongs to',
    parameters: [
      { name: 'address', type: 'string', required: true, description: 'Member address' }
    ],
    isWrite: false
  },
  // Points Module
  {
    module: 'points',
    method: 'createTribeToken',
    description: 'Create a token for a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'name', type: 'string', required: true, description: 'Name of the token' },
      { name: 'symbol', type: 'string', required: true, description: 'Symbol of the token' }
    ],
    isWrite: true
  },
  {
    module: 'points',
    method: 'getTribeTokenAddress',
    description: 'Get the address of a tribe token',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  {
    module: 'points',
    method: 'mintTokens',
    description: 'Mint tokens to an address',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'amount', type: 'string', required: true, description: 'Amount to mint (in wei)' },
      { name: 'recipient', type: 'string', required: true, description: 'Recipient address' }
    ],
    isWrite: true
  },
  {
    module: 'points',
    method: 'setPointsForAction',
    description: 'Set points for an action',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'actionType', type: 'string', required: true, description: 'Type of action (POST_CREATE, COMMENT, etc.)' },
      { name: 'points', type: 'number', required: true, description: 'Number of points' }
    ],
    isWrite: true
  },
  {
    module: 'points',
    method: 'getPoints',
    description: 'Get points earned by a user',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'userAddress', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  {
    module: 'points',
    method: 'setActionPoints',
    description: 'Set points for multiple actions',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'actionPoints', type: 'string', required: true, description: 'JSON of action types and points' }
    ],
    isWrite: true
  },
  {
    module: 'points',
    method: 'getActionPointsConfig',
    description: 'Get points configuration for all actions',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  {
    module: 'points',
    method: 'setExchangeRate',
    description: 'Set token exchange rate',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'rate', type: 'number', required: true, description: 'Exchange rate' }
    ],
    isWrite: true
  },
  {
    module: 'points',
    method: 'getExchangeRate',
    description: 'Get token exchange rate',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  // Content Module
  {
    module: 'content',
    method: 'createPost',
    description: 'Create a post in a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'content', type: 'string', required: true, description: 'Post content' },
      { name: 'metadata', type: 'string', required: false, description: 'JSON metadata for the post' }
    ],
    isWrite: true
  },
  {
    module: 'content',
    method: 'getTribePosts',
    description: 'Get posts from a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'offset', type: 'number', required: false, description: 'Pagination offset' },
      { name: 'limit', type: 'number', required: false, description: 'Number of posts to return' }
    ],
    isWrite: false
  },
  {
    module: 'content',
    method: 'getPostDetails',
    description: 'Get details of a post',
    parameters: [
      { name: 'postId', type: 'number', required: true, description: 'ID of the post' }
    ],
    isWrite: false
  },
  {
    module: 'content',
    method: 'reactToPost',
    description: 'React to a post',
    parameters: [
      { name: 'postId', type: 'number', required: true, description: 'ID of the post' },
      { name: 'reactionType', type: 'string', required: true, description: 'Type of reaction (LIKE, LOVE, etc.)' }
    ],
    isWrite: true
  },
  {
    module: 'content',
    method: 'commentOnPost',
    description: 'Comment on a post',
    parameters: [
      { name: 'postId', type: 'number', required: true, description: 'ID of the post' },
      { name: 'content', type: 'string', required: true, description: 'Comment content' }
    ],
    isWrite: true
  },
  {
    module: 'content',
    method: 'getPostComments',
    description: 'Get comments on a post',
    parameters: [
      { name: 'postId', type: 'number', required: true, description: 'ID of the post' }
    ],
    isWrite: false
  },
  {
    module: 'content',
    method: 'getUserPosts',
    description: 'Get posts created by a user',
    parameters: [
      { name: 'address', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  {
    module: 'content',
    method: 'deletePost',
    description: 'Delete a post',
    parameters: [
      { name: 'postId', type: 'number', required: true, description: 'ID of the post' }
    ],
    isWrite: true
  },
  // Token Module
  {
    module: 'token',
    method: 'getBalance',
    description: 'Get token balance of an address',
    parameters: [
      { name: 'address', type: 'string', required: true, description: 'Address to check balance for' }
    ],
    isWrite: false
  },
  {
    module: 'token',
    method: 'transfer',
    description: 'Transfer tokens to an address',
    parameters: [
      { name: 'recipient', type: 'string', required: true, description: 'Recipient address' },
      { name: 'amount', type: 'string', required: true, description: 'Amount to transfer (in wei)' }
    ],
    isWrite: true
  },
  {
    module: 'token',
    method: 'approve',
    description: 'Approve tokens for spending',
    parameters: [
      { name: 'spender', type: 'string', required: true, description: 'Spender address' },
      { name: 'amount', type: 'string', required: true, description: 'Amount to approve (in wei)' }
    ],
    isWrite: true
  },
  {
    module: 'token',
    method: 'getAllowance',
    description: 'Get approved token amount',
    parameters: [
      { name: 'owner', type: 'string', required: true, description: 'Owner address' },
      { name: 'spender', type: 'string', required: true, description: 'Spender address' }
    ],
    isWrite: false
  },
  // Actions Module
  {
    module: 'actions',
    method: 'recordAction',
    description: 'Record a user action',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'actionType', type: 'string', required: true, description: 'Type of action' },
      { name: 'userAddress', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: true
  },
  {
    module: 'actions',
    method: 'getActionHistory',
    description: 'Get action history for a user',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'userAddress', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  // Analytics Module
  {
    module: 'analytics',
    method: 'getUserActivityMetrics',
    description: 'Get activity metrics for a user',
    parameters: [
      { name: 'address', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  {
    module: 'analytics',
    method: 'getTokenDistribution',
    description: 'Get token distribution metrics',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' }
    ],
    isWrite: false
  },
  {
    module: 'analytics',
    method: 'getEngagementStats',
    description: 'Get engagement statistics',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'timeframe', type: 'string', required: false, description: 'Timeframe (daily, weekly, monthly)' }
    ],
    isWrite: false
  },
  // Profile Module
  {
    module: 'profile',
    method: 'getUserProfile',
    description: 'Get a user profile',
    parameters: [
      { name: 'address', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  {
    module: 'profile',
    method: 'updateProfile',
    description: 'Update user profile',
    parameters: [
      { name: 'metadata', type: 'string', required: true, description: 'Profile metadata JSON' }
    ],
    isWrite: true
  },
  {
    module: 'profile',
    method: 'mintProfileNFT',
    description: 'Mint a profile NFT',
    parameters: [
      { name: 'recipient', type: 'string', required: true, description: 'Recipient address' },
      { name: 'tokenURI', type: 'string', required: true, description: 'Token URI with metadata' }
    ],
    isWrite: true
  },
  // Additional Analytics Methods
  {
    module: 'points',
    method: 'getMemberPoints',
    description: 'Get points earned by a user',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'userAddress', type: 'string', required: true, description: 'User address' }
    ],
    isWrite: false
  },
  {
    module: 'points',
    method: 'getTopMembers',
    description: 'Get top members by points in a tribe',
    parameters: [
      { name: 'tribeId', type: 'number', required: true, description: 'ID of the tribe' },
      { name: 'limit', type: 'number', required: false, description: 'Number of members to return' }
    ],
    isWrite: false
  }
];

interface SDKTesterProps {
  onConnected?: () => void;
}

const SDKTester: React.FC<SDKTesterProps> = ({ onConnected }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [sdk, setSdk] = useState<AstrixSDK | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string>('tribes');
  const [activeMethod, setActiveMethod] = useState<SDKMethod | null>(null);
  const [methodParams, setMethodParams] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const { toasts, showToast } = useToasts();
  
  // Add state for available tribes
  const [availableTribes, setAvailableTribes] = useState<Array<{id: number, name: string}>>([]);
  const [showReadMethods, setShowReadMethods] = useState<boolean>(true);
  
  // Add a constant for local storage key
  const SDK_CONNECTION_KEY = 'TRIBES_SDK_CONNECTION';
  
  // Add state for tracking if session has been restored to prevent multiple toasts
  const [sessionRestoredFlag, setSessionRestoredFlag] = useState(false);
  
  // Group methods by module
  const modules = Array.from(new Set(SDK_METHODS.map(method => method.module)));
  
  // Effect to restore connection from localStorage when component mounts
  useEffect(() => {
    const tryRestoreConnection = async () => {
      try {
        const savedConnection = localStorage.getItem(SDK_CONNECTION_KEY);
        
        if (savedConnection && window.ethereum && !sessionRestoredFlag) {
          setLoading(true);
          
          // Check if still connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            // Restore the connection
            const address = accounts[0];
            setAccount(address);
            
            // Initialize SDK
            const networkConfig = getDefaultNetwork();
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
                collectibleController: '',
                postMinter: '',
                postFeedManager: ''
              },
              verbose: true
            });
            
            // Connect with signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            await tribesSDK.connect(signer);
            
            setSdk(tribesSDK);
            
            // Show toast only once per component instance
            showToast({
              type: 'success',
              title: 'Session Restored',
              message: 'Your previous connection has been restored',
              duration: 3000
            });
            
            // Set flag to prevent multiple toasts
            setSessionRestoredFlag(true);
            
            // Fetch available tribes
            setTimeout(() => {
              fetchAvailableTribes(tribesSDK);
            }, 500);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error("Error restoring connection:", error);
        setLoading(false);
      }
    };
    
    tryRestoreConnection();
    
    // Add event listener for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          disconnectWallet();
          // Reset session restored flag
          setSessionRestoredFlag(false);
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          showToast({
            type: 'success',
            title: 'Account Changed',
            message: 'Connected to a different account',
            duration: 3000
          });
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);
  
  // Add metadata form state
  const [metadataForm, setMetadataForm] = useState<TribeMetadataForm>({
    description: '',
    logoUrl: '',
    bannerUrl: '',
    website: '',
    twitter: '',
    discord: ''
  });
  
  // Handle metadata form changes
  const handleMetadataChange = (field: keyof TribeMetadataForm, value: string) => {
    setMetadataForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Generate JSON and update the methodParams
      const metadataJson = JSON.stringify(updated);
      handleParamChange('metadata', metadataJson);
      
      return updated;
    });
  };
  
  // Add a function to fetch available tribes after connecting
  const fetchAvailableTribes = async (sdkInstance = sdk) => {
    if (!sdkInstance) return;
    
    try {
      const { tribeIds, total } = await sdkInstance.tribes.getAllTribes();
      if (Array.isArray(tribeIds)) {
        // Fetch names for each tribe
        const tribesList = [];
        for (const id of tribeIds.slice(0, 10)) { // Limit to first 10 tribes to avoid too many requests
          try {
            const details = await sdkInstance.tribes.getTribeDetails(Number(id));
            tribesList.push({
              id: Number(id),
              name: details.name || `Tribe #${id}`
            });
          } catch (err) {
            console.error(`Failed to get details for tribe ${id}:`, err);
            tribesList.push({
              id: Number(id),
              name: `Tribe #${id}`
            });
          }
        }
        setAvailableTribes(tribesList);
      }
    } catch (error) {
      console.error("Failed to fetch tribes:", error);
    }
  };
  
  // Add disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
    setSdk(null);
    setAvailableTribes([]);
    // Clear local storage
    localStorage.removeItem(SDK_CONNECTION_KEY);
    
    showToast({
      type: 'info',
      title: 'Disconnected',
      message: 'Wallet has been disconnected'
    });
  };
  
  // Update connect wallet to save connection to localStorage
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Request account access
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Get network configuration
        const networkConfig = getDefaultNetwork();
        
        console.log("Network config:", networkConfig);
        console.log("Using contract addresses:", networkConfig.contracts);
        
        try {
          // Initialize SDK
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
          
          // Save connection to localStorage
          localStorage.setItem(SDK_CONNECTION_KEY, 'true');
          
          showToast({
            type: 'success',
            title: 'Connected',
            message: 'SDK initialized and connected with wallet'
          });
          
          if (onConnected) {
            onConnected();
          }
          
          // Fetch tribes after connecting
          setTimeout(() => {
            fetchAvailableTribes(tribesSDK);
          }, 500);
          
        } catch (error) {
          console.error('Error initializing or connecting SDK:', error);
          setError(`Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`);
          
          showToast({
            type: 'error',
            title: 'SDK Initialization Failed',
            message: `${error instanceof Error ? error.message : String(error)}`
          });
        }
      } else {
        setError('Ethereum wallet not detected. Please install MetaMask or another compatible wallet.');
        
        showToast({
          type: 'error',
          title: 'Wallet Not Detected',
          message: 'Please install MetaMask or another compatible wallet'
        });
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : String(err)}`);
      
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: `${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setLoading(false);
    }
  };
  
  const selectMethod = (method: SDKMethod) => {
    setActiveMethod(method);
    setMethodParams({});
    setResult(null);
    setResultError(null);
    setExecutionTime(null);
    setTxStatus('idle');
    setTxHash(null);
    
    if (method.isWrite) {
      setShowExecuteModal(true);
    }
  };
  
  const handleParamChange = (name: string, value: any) => {
    setMethodParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Function to render metadata form for createTribe method
  const renderMetadataForm = () => {
    if (activeMethod?.method !== 'createTribe') return null;
    
    return (
      <div className="border border-gray-700 rounded-md p-4 mt-4 bg-gray-800/30">
        <h4 className="font-medium text-white mb-3">Tribe Metadata (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Description"
            placeholder="Describe your tribe"
            value={metadataForm.description}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <Input
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            value={metadataForm.logoUrl}
            onChange={(e) => handleMetadataChange('logoUrl', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <Input
            label="Banner URL"
            placeholder="https://example.com/banner.png"
            value={metadataForm.bannerUrl}
            onChange={(e) => handleMetadataChange('bannerUrl', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <Input
            label="Website"
            placeholder="https://yourtribe.com"
            value={metadataForm.website}
            onChange={(e) => handleMetadataChange('website', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <Input
            label="Twitter"
            placeholder="https://twitter.com/yourtribe"
            value={metadataForm.twitter}
            onChange={(e) => handleMetadataChange('twitter', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
          <Input
            label="Discord"
            placeholder="https://discord.gg/yourtribe"
            value={metadataForm.discord}
            onChange={(e) => handleMetadataChange('discord', e.target.value)}
            fullWidth
            className="bg-white dark:bg-gray-800 text-black dark:text-white"
          />
        </div>
        <div className="mt-4">
          <p className="text-sm text-white">This will generate the following JSON:</p>
          <pre className="mt-2 p-3 bg-gray-900 rounded-md text-sm text-white overflow-auto max-h-28">
            {JSON.stringify(metadataForm, null, 2)}
          </pre>
        </div>
      </div>
    );
  };
  
  // Add a function to check if a parameter is a tribe ID
  const isTribeIdParam = (paramName: string) => {
    return paramName === 'tribeId';
  };

  // Update renderTribeIdField to improve contrast in modals
  const renderTribeIdField = (param: { name: string; required: boolean; description: string }) => {
    if (!isTribeIdParam(param.name) || availableTribes.length === 0) {
      return (
        <Input
          key={param.name}
          label={`${param.name}${param.required ? ' *' : ''}`}
          placeholder={param.description}
          value={methodParams[param.name] || ''}
          onChange={(e) => handleParamChange(param.name, e.target.value)}
          helperText="Enter tribe ID number"
          fullWidth
          className="bg-white dark:bg-gray-800 text-black dark:text-white"
        />
      );
    }
    
    return (
      <div key={param.name} className="mb-4">
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          {param.name}{param.required ? ' *' : ''}
        </label>
        <select
          value={methodParams[param.name] || ''}
          onChange={(e) => handleParamChange(param.name, e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
        >
          <option value="">Select a tribe</option>
          {availableTribes.map(tribe => (
            <option key={tribe.id} value={tribe.id.toString()}>
              {tribe.name} (ID: {tribe.id})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{param.description}</p>
      </div>
    );
  };
  
  // Update the rendering of input fields in modals
  const renderModalInput = (param: { name: string; type: string; required: boolean; description: string }) => {
    if (param.name === 'metadata' && activeMethod?.method === 'createTribe') {
      return null;
    }
    
    if (isTribeIdParam(param.name)) {
      return renderTribeIdField(param);
    }
    
    return (
      <Input
        key={param.name}
        label={`${param.name}${param.required ? ' *' : ''}`}
        placeholder={param.description}
        value={methodParams[param.name] || ''}
        onChange={(e) => handleParamChange(param.name, e.target.value)}
        helperText={param.type === 'string' ? param.description : undefined}
        fullWidth
        className="bg-white dark:bg-gray-800 text-black dark:text-white"
      />
    );
  };
  
  const executeMethod = async () => {
    if (!sdk || !activeMethod) return;
    
    try {
      setLoading(true);
      setResult(null);
      setResultError(null);
      setExecutionTime(null);
      
      if (activeMethod.isWrite) {
        setTxStatus('pending');
      }
      
      // Prepare parameters object based on the method's requirements
      const params: Record<string, any> = {};
      
      activeMethod.parameters.forEach(param => {
        if (param.required && methodParams[param.name] === undefined) {
          throw new Error(`Parameter ${param.name} is required`);
        }
        
        if (methodParams[param.name] !== undefined) {
          // Convert types as needed
          if (param.type === 'number') {
            params[param.name] = Number(methodParams[param.name]);
          } else if (param.name === 'metadata' && typeof methodParams[param.name] === 'string') {
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(methodParams[param.name]);
              params[param.name] = methodParams[param.name]; // Keep as string for SDK
            } catch (e) {
              // Not valid JSON, keep as string
              params[param.name] = methodParams[param.name];
            }
          } else {
            params[param.name] = methodParams[param.name];
          }
        }
      });
      
      // Special case handling for methods
      const methodName = activeMethod.method;
      const module = activeMethod.module;
      
      console.log(`Executing ${module}.${methodName} with params:`, params);
      
      // Start timing execution
      const startTime = performance.now();
      
      let result;
      
      try {
        // Handle special cases for methods that need custom handling
        if (module === 'tribes' && methodName === 'getMembers') {
          // Get tribe members using direct interface - use contract directly if needed
          const tribeId = params.tribeId;
          try {
            result = await sdk.tribes.getMembers(tribeId);
          } catch (err) {
            // If SDK method fails, try direct contract access
            console.log("SDK method failed, attempting direct contract call...");
            const tribeController = await (sdk as any).getContract?.('tribeController');
            if (tribeController && typeof tribeController.getMembers === 'function') {
              result = await tribeController.getMembers(tribeId);
            } else {
              throw new Error("Could not access tribe members through SDK or direct contract");
            }
          }
        } 
        else if (module === 'tribes' && (methodName === 'getTribeDetails' || methodName === 'getTribe')) {
          // Handle getTribe/getTribeDetails with fallback to direct contract call
          const tribeId = params.tribeId;
          try {
            result = await sdk.tribes.getTribeDetails(tribeId);
          } catch (err) {
            // If SDK method fails, try direct contract access
            console.log("SDK method failed, attempting direct contract call...");
            const tribeController = await (sdk as any).getContract?.('tribeController');
            
            // Try different method names that might exist on the contract
            if (tribeController && typeof tribeController.getTribeDetails === 'function') {
              result = await tribeController.getTribeDetails(tribeId);
            } 
            else if (tribeController && typeof tribeController.tribes === 'function') {
              result = await tribeController.tribes(tribeId);
            }
            else {
              throw new Error("Could not access tribe details through SDK or direct contract");
            }
          }
        }
        else {
          // Standard method execution with params
          if (Object.keys(params).length === 0) {
            result = await (sdk as any)[module][methodName]();
          } else {
            result = await (sdk as any)[module][methodName](params);
          }
        }
      } catch (error: any) {
        console.error(`Error executing ${module}.${methodName}:`, error);
        throw error;
      }
      
      // Calculate execution time
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      
      console.log(`Result from ${module}.${methodName}:`, result);
      setResult(result);
      
      if (activeMethod.isWrite) {
        setTxStatus('success');
        // If result is a transaction hash, store it
        if (typeof result === 'string' && result.startsWith('0x')) {
          setTxHash(result);
        }
        
        showToast({
          type: 'success',
          title: 'Transaction Successful',
          message: 'Your transaction was processed successfully'
        });
      } else {
        // For read methods, show modal with result
        setShowResultModal(true);
      }
      
    } catch (error) {
      console.error("Error executing method:", error);
      setResultError(error instanceof Error ? error.message : String(error));
      
      if (activeMethod.isWrite) {
        setTxStatus('error');
      }
      
      // Show modal with error for read methods
      if (!activeMethod.isWrite) {
        setShowResultModal(true);
      } else {
        showToast({
          type: 'error',
          title: 'Transaction Failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    } finally {
      setLoading(false);
      
      // ALWAYS close the execute modal when done, regardless of success/failure
      setShowExecuteModal(false);
      
      // For write methods, always show the result modal after transaction is processed
      if (activeMethod.isWrite) {
        setShowResultModal(true);
      }
    }
  };
  
  // Update renderModuleTabs to highlight active module with a bold outline and better colors
  const renderModuleTabs = () => (
    <div className="space-y-3">
      {['all', 'tribes', 'points', 'content', 'token', 'analytics', 'profile'].map(module => (
        <button
          key={module}
          onClick={() => setActiveModule(module)}
          className={`
            w-full text-left px-3 py-2.5 rounded-md transition-colors
            flex justify-between items-center
            ${activeModule === module 
              ? 'bg-accent/20 text-accent font-medium border border-accent/30' 
              : 'text-muted-foreground hover:text-foreground-dark hover:bg-input-dark'
            }
          `}
        >
          <span className="capitalize">{module === 'all' ? 'All Modules' : module}</span>
          {activeModule === module && (
            <span className="ml-2 text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  );
  
  // Render methods list with improved styling and organization
  const renderMethodsList = () => {
    // Filter methods by module and read/write status
    const filteredMethods = SDK_METHODS.filter(method => {
      if (activeModule === 'all') return true;
      if (!showReadMethods && !method.isWrite) return false;
      return method.module === activeModule;
    });

    // If no methods match filters
    if (filteredMethods.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground italic">
          No methods available for this module.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredMethods.map(method => (
          <div 
            key={`${method.module}-${method.method}`}
            className={`
              p-4 border border-gray-800 rounded-lg cursor-pointer
              transition-all duration-200
              ${activeMethod?.method === method.method ? 'bg-input-dark border-gray-700' : 'bg-card-dark hover:bg-input-dark/60'}
            `}
            onClick={() => selectMethod(method)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <h3 className="text-md font-semibold text-foreground-dark">{method.method}</h3>
                <Badge 
                  className={`ml-3 ${method.isWrite ? 'bg-accent/20 text-accent' : 'bg-accent/20 text-accent'}`}
                >
                  {method.isWrite ? 'Write' : 'Read'}
                </Badge>
              </div>
              <Button 
                variant={method.isWrite ? "primary" : "outline"} 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  selectMethod(method);
                  setShowExecuteModal(true);
                }}
                className="flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                {method.isWrite ? 'Execute' : 'Call'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
            {method.parameters.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-muted-foreground">{method.parameters.length} params</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render the appropriate result visualization based on the data type
  const renderResultVisualization = () => {
    if (!result) return null;
    
    // If the result is an array of tribes
    if (activeMethod?.method === 'getAllTribes' && Array.isArray(result)) {
      return (
        <div className="mt-4 space-y-4">
          <h4 className="text-lg font-medium text-foreground-dark">Tribes ({result.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.map((tribe: any) => (
              <Card key={tribe.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tribe.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="mr-2">ID:</span>
                    <Badge variant="secondary" size="sm">{tribe.id.toString()}</Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <span className="mr-2">Members:</span>
                    <Badge variant="outline" size="sm">{tribe.memberCount.toString()}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    
    // If the result is a single tribe from getTribeDetails
    if (activeMethod?.method === 'getTribeDetails' && result && typeof result === 'object') {
      // Try to parse metadata if it exists
      let parsedMetadata = {};
      if (result.metadata) {
        try {
          parsedMetadata = JSON.parse(result.metadata);
        } catch (e) {
          // Keep as is if parsing fails
          parsedMetadata = { raw: result.metadata };
        }
      }
      
      return (
        <div className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{result.name}</CardTitle>
                <Badge variant="secondary">ID: {result.id.toString()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Basic Info</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-muted-foreground">Members:</span>
                      <Badge variant="outline">{result.memberCount?.toString() || '0'}</Badge>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-muted-foreground">Created by:</span>
                      <span className="font-mono text-xs">{result.creator?.substring(0, 10)}...</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-muted-foreground">Join Type:</span>
                      <Badge variant="secondary">{result.joinType === 0 ? 'Public' : result.joinType === 1 ? 'Private' : 'Invite'}</Badge>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="w-32 text-muted-foreground">Entry Fee:</span>
                      <span>{parseFloat(ethers.formatEther(result.entryFee || '0')).toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
                
                {Object.keys(parsedMetadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Metadata</h4>
                    <div className="bg-card-dark p-3 rounded-md border border-gray-700">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-48">
                        {JSON.stringify(parsedMetadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // If the result is an array of members
    if (activeMethod?.method === 'getMembers' && Array.isArray(result)) {
      return (
        <div className="mt-4 space-y-4">
          <h4 className="text-lg font-medium text-foreground-dark">Members ({result.length})</h4>
          <div className="space-y-2">
            {result.map((address: string, index: number) => (
              <Card key={index} variant="flat" className="p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-input-dark flex items-center justify-center text-foreground-dark mr-3">
                    {address.substring(2, 4)}
                  </div>
                  <span className="font-mono text-sm">{address}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    
    // Default JSON view for other result types
    return (
      <Card variant="flat" className="mt-4 p-4">
        <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto max-h-80 text-foreground-dark">
          {result === null ? 'null' : 
           typeof result === 'undefined' ? 'undefined' : 
           typeof result === 'object' ? JSON.stringify(result, null, 2) :
           String(result)}
        </pre>
      </Card>
    );
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar - Account & Module Selection */}
      <div className="lg:col-span-1 space-y-4">
        {/* Connection Panel */}
        <Card className="overflow-hidden border-gray-800">
          <CardHeader className="bg-card-dark pb-3">
            <CardTitle>Connected Account:</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-4 flex flex-col items-start gap-3 bg-card-dark">
            {account ? (
              <>
                <div className="text-foreground-dark truncate w-full font-mono text-sm bg-input-dark p-2 rounded">
                  {account}
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-600/90 text-white py-1 px-3">Connected</Badge>
                  <Button variant="secondary" onClick={disconnectWallet} size="sm">
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground italic w-full text-center p-4">Not connected</div>
                <Button 
                  variant="primary" 
                  onClick={connectWallet} 
                  isLoading={loading}
                  className="w-full"
                >
                  Connect Wallet
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Module Selection */}
        <Card className="border-gray-800">
          <CardHeader className="bg-card-dark pb-3">
            <CardTitle>SDK Modules</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 bg-card-dark">
            {renderModuleTabs()}
          </CardContent>
          <CardFooter className="bg-card-dark pt-1 pb-4 border-t border-gray-800/30">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-read-methods"
                checked={showReadMethods}
                onChange={(e) => setShowReadMethods(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="show-read-methods" className="text-sm text-muted-foreground">
                Show Read Methods
              </label>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column - Methods & Results */}
      <div className="lg:col-span-3">
        {/* Test SDK Methods */}
        <Card className="border-gray-800">
          <CardHeader className="bg-card-dark pb-3">
            <CardTitle>Available Methods</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 bg-card-dark">
            {/* Methods List */}
            {renderMethodsList()}
          </CardContent>
        </Card>
      </div>
      
      {/* Result Modal */}
      <Modal 
        isOpen={showResultModal} 
        onClose={() => setShowResultModal(false)}
        title="Method Result"
      >
        <div className="p-4">
          {resultError ? (
            <div className="p-4 mb-4 bg-red-800/25 border border-red-800/50 text-red-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-1 text-red-200">Error</h3>
              <p className="font-mono text-sm whitespace-pre-wrap">{resultError}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-green-800/25 border border-green-800/50 text-green-300 rounded-lg">
                <h3 className="text-lg font-semibold mb-1 text-green-200">Success</h3>
                {executionTime !== null && (
                  <p className="text-xs mb-2 text-green-400/80">Execution time: {executionTime}ms</p>
                )}
              </div>
              {renderResultVisualization()}
            </>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowResultModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
      
      {/* Method Execution Modal */}
      <Modal 
        isOpen={showExecuteModal} 
        onClose={() => {
          if (txStatus !== 'pending') {
            setShowExecuteModal(false);
          }
        }}
        title={activeMethod ? `Execute ${activeMethod.method}` : 'Execute Method'}
      >
        <div className="p-4">
          {activeMethod && (
            <>
              {activeMethod.parameters.length > 0 && (
                <div className="space-y-4 mb-6">
                  {activeMethod.parameters.map(param => (
                    renderModalInput(param)
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowExecuteModal(false)}
                  disabled={txStatus === 'pending'}
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={executeMethod} 
                  variant="primary" 
                  isLoading={txStatus === 'pending'}
                  disabled={txStatus === 'pending' || !sdk || !account}
                >
                  {activeMethod.isWrite ? 'Submit Transaction' : 'Execute'}
                </Button>
              </div>
              
              {txStatus !== 'idle' && (
                <div className={`mt-4 p-4 rounded-lg ${
                  txStatus === 'pending' ? 'bg-yellow-800/25 border-yellow-800/50 text-yellow-300' :
                  txStatus === 'success' ? 'bg-green-800/25 border-green-800/50 text-green-300' :
                  'bg-red-800/25 border-red-800/50 text-red-300'
                } border`}>
                  <h3 className="font-semibold mb-1">
                    {txStatus === 'pending' ? 'Transaction Pending' :
                     txStatus === 'success' ? 'Transaction Successful' :
                     'Transaction Failed'}
                  </h3>
                  
                  {txHash && (
                    <div className="mt-2">
                      <p className="text-sm mb-1">Transaction Hash:</p>
                      <div className="font-mono text-xs bg-gray-900/50 p-2 rounded overflow-x-auto">
                        {txHash}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SDKTester; 