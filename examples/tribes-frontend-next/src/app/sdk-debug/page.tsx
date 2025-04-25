'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { getDefaultNetwork, ContractAddresses } from '../config/contracts';
import styles from './page.module.css';

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function SDKDebugPage() {
  const [log, setLog] = useState<string[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sdk, setSdk] = useState<AstrixSDK | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const clearLog = () => {
    setLog([]);
  };

  const initializeSDK = async () => {
    try {
      setLoading(true);
      setError(null);
      clearLog();
      addLog('Starting SDK initialization');

      if (!window.ethereum) {
        const errorMsg = 'Ethereum provider not found. Please install MetaMask.';
        setError(errorMsg);
        addLog(errorMsg);
        return;
      }

      // Request accounts
      addLog('Requesting accounts from wallet');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider
      addLog('Creating BrowserProvider');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get signer
      addLog('Getting signer');
      const signer = await provider.getSigner();
      
      // Get address
      addLog('Getting address');
      const address = await signer.getAddress();
      setAccount(address);
      addLog(`Connected to account: ${address}`);
      
      // Get network
      addLog('Getting network info');
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      addLog(`Connected to chain ID: ${currentChainId}`);
      
      // Get network config
      const networkConfig = getDefaultNetwork();
      addLog(`Using network config for: ${networkConfig.name} (chainId: ${networkConfig.chainId})`);
      
      if (currentChainId !== networkConfig.chainId) {
        addLog(`WARNING: Current chain ID (${currentChainId}) doesn't match configured network (${networkConfig.chainId})`);
        
        try {
          addLog('Attempting to switch network...');
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
          });
          addLog('Network switched successfully');
        } catch (switchError) {
          addLog(`Error switching network: ${switchError instanceof Error ? switchError.message : String(switchError)}`);
          addLog('Continuing with current network...');
        }
      }
      
      // Log contract addresses
      addLog('Contract addresses:');
      Object.entries(networkConfig.contracts).forEach(([key, value]) => {
        addLog(`- ${key}: ${value}`);
      });
      
      try {
        // Check contract addresses
        addLog('Validating contract addresses...');
        let allValid = true;
        
        for (const [key, value] of Object.entries(networkConfig.contracts)) {
          if (!value || !ethers.isAddress(value)) {
            addLog(`✗ ${key}: Invalid address - ${value}`);
            allValid = false;
          } else {
            addLog(`✓ ${key}: Valid address`);
          }
        }
        
        if (!allValid) {
          addLog('WARNING: Some contract addresses are invalid or missing');
        }
        
        // Initialize SDK
        addLog('Initializing AstrixSDK...');
        
        // Ensure profileNFTMinter is a string
        const sdkContracts = {
          ...networkConfig.contracts,
          profileNFTMinter: networkConfig.contracts.profileNFTMinter || ''
        };
        
        // Try approach 1: Raw window.ethereum with original contracts object
        addLog('Approach 1: Using raw window.ethereum with contracts directly');
        try {
          const tribesSDK = new AstrixSDK({
            provider: window.ethereum,
            chainId: networkConfig.chainId,
            contracts: sdkContracts,
            verbose: true
          });
          
          addLog('SDK initialized successfully with approach 1');
          addLog('Connecting signer...');
          await tribesSDK.connect(signer);
          addLog('Signer connected successfully');
          
          // Set SDK state
          setSdk(tribesSDK);
          
          // Test tribes module
          addLog('Testing tribes module...');
          const tribes = await tribesSDK.tribes.getAllTribes();
          addLog(`Retrieved ${tribes.tribeIds.length} tribes`);
          return;
        } catch (error1) {
          addLog(`Approach 1 failed: ${error1 instanceof Error ? error1.message : String(error1)}`);
        }
        
        // Try approach 2: JsonRpcProvider
        addLog('Approach 2: Using JsonRpcProvider');
        try {
          const jsonRpcProvider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
          const tribesSDK = new AstrixSDK({
            provider: jsonRpcProvider,
            chainId: networkConfig.chainId,
            contracts: sdkContracts,
            verbose: true
          });
          
          addLog('SDK initialized successfully with approach 2');
          addLog('Connecting signer...');
          await tribesSDK.connect(signer);
          addLog('Signer connected successfully');
          
          // Set SDK state
          setSdk(tribesSDK);
          
          // Test tribes module
          addLog('Testing tribes module...');
          const tribes = await tribesSDK.tribes.getAllTribes();
          addLog(`Retrieved ${tribes.tribeIds.length} tribes`);
          return;
        } catch (error2) {
          addLog(`Approach 2 failed: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
        
        // Try approach 3: Using Web3Provider string
        addLog('Approach 3: Using window.ethereum.provider string conversion');
        try {
          // Try to use a string representation to make ethers handle correctly
          const tribesSDK = new AstrixSDK({
            provider: window.ethereum,  
            chainId: networkConfig.chainId,
            contracts: sdkContracts,
            verbose: true
          });
          
          addLog('SDK initialized successfully with approach 3');
          addLog('Connecting signer directly...');
          // Pass the signer directly
          await tribesSDK.connect(signer);
          addLog('Signer connected successfully');
          
          // Set SDK state
          setSdk(tribesSDK);
          
          // Test tribes module
          addLog('Testing tribes module...');
          const tribes = await tribesSDK.tribes.getAllTribes();
          addLog(`Retrieved ${tribes.tribeIds.length} tribes`);
          return;
        } catch (error3) {
          addLog(`Approach 3 failed: ${error3 instanceof Error ? error3.message : String(error3)}`);
        }
        
        // Try approach 4: Using provider from signer
        addLog('Approach 4: Using provider from signer');
        try {
          // Get the provider's connection info and create a new JsonRpcProvider
          const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
          
          const tribesSDK = new AstrixSDK({
            provider,
            chainId: networkConfig.chainId,
            contracts: sdkContracts,
            verbose: true
          });
          
          addLog('SDK initialized successfully with approach 4');
          // Connect with signer
          await tribesSDK.connect(signer);
          addLog('Connected signer to SDK');
          
          // Set SDK state
          setSdk(tribesSDK);
          
          // Test tribes module
          addLog('Testing tribes module...');
          const tribes = await tribesSDK.tribes.getAllTribes();
          addLog(`Retrieved ${tribes.tribeIds.length} tribes`);
          return;
        } catch (error4) {
          addLog(`Approach 4 failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
        
        // All approaches failed
        throw new Error("All initialization approaches failed");
        
      } catch (e) {
        const errorMsg = `SDK initialization error: ${e instanceof Error ? e.message : String(e)}`;
        setError(errorMsg);
        addLog(errorMsg);
        console.error('SDK initialization error:', e);
      }
      
    } catch (e) {
      const errorMsg = `General error: ${e instanceof Error ? e.message : String(e)}`;
      setError(errorMsg);
      addLog(errorMsg);
      console.error('General error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>SDK Debug Page</h1>
      
      <div className={styles.info}>
        {account ? (
          <div>
            <p className={styles.account}>Connected Account: {account}</p>
            <button 
              className={styles.buttonSecondary} 
              onClick={initializeSDK} 
              disabled={loading}
            >
              {loading ? 'Trying...' : 'Try Again'}
            </button>
          </div>
        ) : (
          <button 
            className={styles.button} 
            onClick={initializeSDK} 
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet & Initialize SDK'}
          </button>
        )}
        
        {error && (
          <div className={styles.error}>
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {sdk && (
          <div className={styles.success}>
            <h3>SDK initialized successfully</h3>
          </div>
        )}
      </div>
      
      <div className={styles.logContainer}>
        <h2 className={styles.logTitle}>Debug Log</h2>
        <div className={styles.log}>
          {log.map((entry, index) => (
            <div key={index} className={styles.logEntry}>
              {entry}
            </div>
          ))}
          {log.length === 0 && <p className={styles.emptyLog}>No logs yet. Connect wallet to begin debugging.</p>}
        </div>
      </div>
    </div>
  );
} 