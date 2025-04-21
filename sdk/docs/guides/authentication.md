# Authentication Guide

This guide explains how to authenticate and manage identities with the Tribes by Astrix SDK.

## Overview

The Tribes by Astrix SDK supports multiple authentication methods:

1. **Wallet-based authentication** - Using crypto wallets (MetaMask, WalletConnect, etc.)
2. **API key authentication** - For server-side applications
3. **OAuth authentication** - For web applications integrating with existing identity providers
4. **Guest mode** - For limited functionality without authentication

## Wallet Authentication

Wallet authentication is the primary method for dApps built with the SDK.

### Connecting a Wallet

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Initialize SDK
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  walletOptions: {
    preferredWallets: ['metamask', 'walletconnect'], // Optional preference
    appName: 'My Tribes App',                       // Used in connection requests
    network: 'mainnet'                              // Or 'testnet'
  }
});

// Connect wallet (prompts user for wallet selection)
try {
  const account = await sdk.auth.connectWallet();
  console.log('Connected address:', account.address);
  
  // The SDK's authenticated state is now set
  const isAuthenticated = sdk.auth.isAuthenticated(); // true
} catch (error) {
  console.error('Wallet connection failed:', error.message);
}
```

### Connecting with a Specific Provider

```typescript
// Connect specifically with MetaMask
const account = await sdk.auth.connectWallet('metamask');

// Connect with WalletConnect
const account = await sdk.auth.connectWallet('walletconnect');

// Connect with Coinbase Wallet
const account = await sdk.auth.connectWallet('coinbase');
```

### Working with Connected Accounts

```typescript
// Get the current connected account
const account = sdk.auth.getAccount();
if (account) {
  console.log('Address:', account.address);
  console.log('Chain ID:', account.chainId);
  console.log('Wallet type:', account.walletType);
}

// Check if user is on the correct network
const isCorrectNetwork = sdk.auth.isCorrectNetwork();
if (!isCorrectNetwork) {
  // Prompt user to switch networks
  await sdk.auth.switchNetwork('mainnet'); // or specific chainId
}

// Disconnect wallet
await sdk.auth.disconnectWallet();
```

### Message Signing

For secure operations, the SDK may require message signing:

```typescript
// Sign a message
const message = 'Sign this message to verify your ownership of this account';
try {
  const signature = await sdk.auth.signMessage(message);
  console.log('Signature:', signature);
  
  // Verify signature (typically done server-side)
  const isValid = await sdk.auth.verifySignature(message, signature, account.address);
  console.log('Signature valid:', isValid);
} catch (error) {
  console.error('Signing failed:', error.message);
}
```

## API Key Authentication

For server-side applications or non-interactive clients:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Initialize with API key
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  apiKey: 'your-api-key-here'
});

// API key authentication is automatic
const isAuthenticated = sdk.auth.isAuthenticated(); // true

// You can also check API key validity explicitly
try {
  await sdk.auth.validateApiKey();
  console.log('API key is valid');
} catch (error) {
  console.error('API key is invalid:', error.message);
}
```

### Managing API Keys

Instructions for generating and managing API keys:

1. Go to the [Tribes by Astrix Developer Portal](https://developer.tribesbyastrix.com)
2. Sign in with your wallet
3. Navigate to "API Keys" section
4. Create a new key and set appropriate permissions
5. Store your API key securely - it cannot be displayed again after creation

## OAuth Authentication

For web applications that prefer traditional OAuth flows:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Initialize SDK for OAuth
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  oauthOptions: {
    clientId: 'your-client-id',
    redirectUri: 'https://your-app.com/callback',
    scope: 'identity tribes:read tribes:write points:read'
  }
});

// Generate OAuth login URL
const loginUrl = sdk.auth.getOAuthLoginUrl();
// Redirect user to loginUrl or open it in a popup

// In your callback handler:
async function handleOAuthCallback() {
  // Get code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    try {
      // Exchange code for tokens
      await sdk.auth.completeOAuthLogin(code);
      console.log('OAuth login successful');
      
      // Get user info
      const user = await sdk.users.getCurrentUser();
      console.log('Logged in as:', user.username);
    } catch (error) {
      console.error('OAuth login failed:', error.message);
    }
  }
}
```

### Token Management

The SDK automatically handles token refresh. However, you can access token details if needed:

```typescript
// Get current token info
const tokenInfo = sdk.auth.getTokenInfo();
if (tokenInfo) {
  console.log('Expires at:', new Date(tokenInfo.expiresAt));
  console.log('Scopes:', tokenInfo.scope);
}

// Manually refresh token
await sdk.auth.refreshToken();

// Remove tokens and log out
await sdk.auth.logout();
```

## Guest Mode

To enable limited functionality without authentication:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Initialize SDK with guest mode
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  allowGuestMode: true
});

// Start in guest mode
sdk.auth.useGuestMode();

// Check if in guest mode
const isGuest = sdk.auth.isGuestMode(); // true

// Later, connect a wallet to upgrade from guest mode
const account = await sdk.auth.connectWallet();
```

In guest mode, users can:
- View public tribes and their content
- Browse tribal activity
- Read public posts

But cannot:
- Create or join tribes
- Create posts or comments
- Earn or transfer points
- Access gated content

## Persistent Authentication

Keep users logged in across sessions:

```typescript
// Enable persistence during initialization
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  authPersistence: true // Stores auth state in localStorage
});

// Or enable/disable later
sdk.auth.enablePersistence();
sdk.auth.disablePersistence();

// Check if previous session exists on startup
const hasSession = sdk.auth.hasStoredSession();
if (hasSession) {
  try {
    // Restore previous session
    await sdk.auth.restoreSession();
    console.log('Session restored successfully');
  } catch (error) {
    console.error('Session restoration failed:', error.message);
    // Fall back to guest mode or prompt for login
    sdk.auth.useGuestMode();
  }
}
```

## Authentication Events

Subscribe to authentication events:

```typescript
// Listen for auth state changes
sdk.auth.onAuthStateChanged((authState) => {
  console.log('New auth state:', authState);
  if (authState.isAuthenticated) {
    console.log('User authenticated:', authState.address || authState.userId);
  } else {
    console.log('User logged out');
  }
});

// Listen for wallet events
sdk.auth.onWalletChanged((newAddress) => {
  console.log('Wallet address changed:', newAddress);
});

sdk.auth.onNetworkChanged((newChainId) => {
  console.log('Network changed:', newChainId);
});

// Remove listeners when done
sdk.auth.offAuthStateChanged(myHandler);
```

## Using with React

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Create Auth Context
const AuthContext = createContext(null);

export function AuthProvider({ children, sdkInstance }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Try to restore session on mount
    async function initAuth() {
      try {
        if (sdkInstance.auth.hasStoredSession()) {
          await sdkInstance.auth.restoreSession();
          const currentUser = await sdkInstance.users.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    }
    
    initAuth();
    
    // Listen for auth changes
    const unsubscribe = sdkInstance.auth.onAuthStateChanged((authState) => {
      if (authState.isAuthenticated) {
        sdkInstance.users.getCurrentUser().then(setUser);
      } else {
        setUser(null);
      }
    });
    
    return () => unsubscribe();
  }, [sdkInstance]);
  
  // Auth functions
  const login = async (walletType) => {
    try {
      await sdkInstance.auth.connectWallet(walletType);
      const currentUser = await sdkInstance.users.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    await sdkInstance.auth.disconnectWallet();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Usage in a component
function LoginButton() {
  const { login, isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    return <p>Welcome, {user.username}!</p>;
  }
  
  return (
    <button onClick={() => login('metamask')}>
      Connect with MetaMask
    </button>
  );
}
```

## Multi-Chain Support

The SDK supports multiple blockchains:

```typescript
import { TribesSDK, ChainId } from 'tribes-by-astrix-sdk';

const sdk = new TribesSDK({
  networks: {
    // Configure multiple networks
    [ChainId.ETHEREUM_MAINNET]: {
      rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
      name: 'Ethereum Mainnet'
    },
    [ChainId.OPTIMISM]: {
      rpcUrl: 'https://mainnet.optimism.io',
      name: 'Optimism'
    },
    [ChainId.POLYGON]: {
      rpcUrl: 'https://polygon-rpc.com',
      name: 'Polygon'
    }
  },
  defaultNetwork: ChainId.OPTIMISM // Set default network
});

// Switch networks programmatically
await sdk.auth.switchNetwork(ChainId.POLYGON);

// Check current network
const currentChainId = sdk.auth.getChainId();
console.log('Current network:', sdk.networks.getNetworkName(currentChainId));
```

## Security Best Practices

1. **Never store API keys in client-side code**
   - Use API keys only in server-side applications
   - Implement proper access controls and rate limiting

2. **Implement proper error handling**
   ```typescript
   try {
     await sdk.auth.connectWallet();
   } catch (error) {
     if (error.code === 'user_rejected') {
       console.log('User rejected the connection request');
     } else if (error.code === 'unsupported_chain') {
       console.log('Please switch to a supported network');
     } else {
       console.error('Authentication error:', error.message);
     }
   }
   ```

3. **Verify message signatures for sensitive operations**
   - Use `signMessage` and `verifySignature` for critical actions
   - Implement server-side verification for high-value transactions

4. **Handle network changes gracefully**
   ```typescript
   sdk.auth.onNetworkChanged((chainId) => {
     const supportedChains = [ChainId.ETHEREUM_MAINNET, ChainId.OPTIMISM];
     if (!supportedChains.includes(chainId)) {
       alert('Please switch to a supported network');
       sdk.auth.switchNetwork(ChainId.ETHEREUM_MAINNET);
     }
   });
   ```

5. **Enable persistence only when necessary**
   - Consider security implications of storing authentication data
   - Clear stored session data on sensitive devices
   ```typescript
   // Clear any stored session data
   sdk.auth.clearStoredSession();
   ```

## Troubleshooting

### Common Issues and Resolutions

| Issue | Possible Cause | Resolution |
|-------|---------------|------------|
| "User rejected request" | User declined to connect wallet | Provide better UX explaining why connection is needed |
| "Network not supported" | User's wallet is on wrong network | Guide user to switch or use `switchNetwork()` |
| "Invalid API key" | API key is incorrect or revoked | Check key in developer portal and regenerate if needed |
| "Session expired" | OAuth or session token expired | Implement automatic token refresh or prompt re-login |
| "Method not supported" | Wallet doesn't support requested operation | Check wallet compatibility or provide alternative method |
| "Already processing auth request" | Multiple auth requests in progress | Implement request locking or UI feedback for pending state |

### Debugging Authentication

```typescript
// Enable detailed logging
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  debug: true,
  logLevel: 'debug'
});

// Log auth state for debugging
console.log('Auth state:', sdk.auth.getAuthState());
console.log('Connected account:', sdk.auth.getAccount());

// Validate connections
const connectionStatus = await sdk.auth.checkConnectionStatus();
console.log('Connection status:', connectionStatus);
```

## Further Resources

- [SDK API Reference](../api/index.html) - For detailed authentication method documentation
- [Example Projects](https://github.com/tribesbyastrix/sdk-examples) - Reference implementations
- [Error Handling Guide](./error-handling.md) - How to handle authentication errors specifically 