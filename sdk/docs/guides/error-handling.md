# Error Handling

This guide explains how to effectively handle errors when using the Tribes by Astrix SDK.

## Overview

The SDK uses a consistent error handling pattern to help you identify and resolve issues:

1. All SDK errors extend from a base `TribesSDKError` class
2. Each error contains a specific error code, message, and contextual data
3. Errors are categorized by domain (authentication, tribes, transactions, etc.)
4. Detailed stack traces are included in development mode

## Error Structure

```typescript
interface TribesSDKError extends Error {
  code: string;        // Unique error identifier (e.g., 'auth/wallet_not_connected')
  message: string;     // Human-readable error description
  details?: any;       // Additional contextual information
  originalError?: any; // Original error that caused this error (if applicable)
}
```

## Common Error Patterns

### Try-Catch Pattern

The most common pattern for handling SDK errors:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

const sdk = new TribesSDK({ rpcUrl: 'https://rpc-url.com' });

async function joinTribe(tribeId) {
  try {
    await sdk.tribes.join(tribeId);
    console.log('Successfully joined tribe!');
    return true;
  } catch (error) {
    if (error.code === 'tribes/already_member') {
      console.log('You are already a member of this tribe');
    } else if (error.code === 'tribes/insufficient_funds') {
      console.log('Insufficient funds to pay the entry fee');
    } else if (error.code === 'auth/not_authenticated') {
      console.log('Please connect your wallet first');
    } else {
      console.error('Failed to join tribe:', error.message);
    }
    return false;
  }
}
```

### Async/Await with Error Propagation

For middleware or complex functions:

```typescript
async function processTribeAction(tribeId, action) {
  try {
    // Validate inputs first
    if (!tribeId) {
      throw {
        code: 'app/invalid_input',
        message: 'Tribe ID is required'
      };
    }
    
    // Perform action based on type
    switch (action) {
      case 'join':
        return await sdk.tribes.join(tribeId);
      case 'leave':
        return await sdk.tribes.leave(tribeId);
      default:
        throw {
          code: 'app/invalid_action',
          message: `Unknown action: ${action}`
        };
    }
  } catch (error) {
    // Add context and rethrow
    if (error.code?.startsWith('app/')) {
      // Our application error, just rethrow
      throw error;
    } else {
      // SDK or unexpected error, add context
      console.error(`Error in tribe action '${action}':`, error);
      throw {
        code: 'app/action_failed',
        message: `Failed to ${action} tribe: ${error.message}`,
        details: { tribeId, action },
        originalError: error
      };
    }
  }
}
```

### Promise-Based Error Handling

For chained operations:

```typescript
sdk.tribes.create({
  name: 'My New Tribe',
  description: 'This is a new tribe!'
})
  .then(newTribe => {
    console.log('Created tribe:', newTribe.id);
    return sdk.tribes.inviteUsers(newTribe.id, ['0x123...', '0x456...']);
  })
  .then(invites => {
    console.log('Sent invites:', invites.length);
  })
  .catch(error => {
    if (error.code === 'auth/insufficient_permissions') {
      console.error('You do not have permission to create tribes');
    } else {
      console.error('Failed during tribe creation flow:', error.message);
    }
  });
```

## Error Categories

### Authentication Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `auth/not_authenticated` | No active authentication session | Attempting operations before connecting wallet |
| `auth/wallet_not_connected` | No wallet is connected | Operations requiring wallet signature |
| `auth/user_rejected` | User rejected the request | User denied wallet signature request |
| `auth/unsupported_chain` | Chain ID not supported | Wallet connected to unsupported network |
| `auth/signature_failed` | Failed to sign message | Wallet disconnected during signing |
| `auth/api_key_invalid` | Invalid API key | Incorrect or revoked API key |
| `auth/session_expired` | Authentication session expired | Token expired and failed to refresh |

```typescript
// Example: Handle authentication errors
try {
  await sdk.auth.connectWallet();
} catch (error) {
  switch (error.code) {
    case 'auth/user_rejected':
      showNotification('Connection rejected. Please approve the connection request.');
      break;
    case 'auth/unsupported_chain':
      showNetworkSelector('Please switch to a supported network');
      break;
    case 'auth/wallet_not_found':
      showWalletOptions('Please install a supported wallet');
      break;
    default:
      console.error('Authentication error:', error.message);
  }
}
```

### Tribe Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `tribes/not_found` | Tribe not found | Tribe ID doesn't exist or was deleted |
| `tribes/already_member` | Already a tribe member | Attempting to join a tribe you're already in |
| `tribes/not_member` | Not a tribe member | Attempting member-only actions |
| `tribes/insufficient_funds` | Insufficient funds | Unable to pay tribe entry fee |
| `tribes/already_exists` | Tribe already exists | Creating a tribe with duplicate name |
| `tribes/unauthorized` | Unauthorized action | Non-admin attempting admin-only actions |

```typescript
// Example: Handle tribe membership errors
async function handleTribeJoin(tribeId) {
  try {
    const tribeDetails = await sdk.tribes.getTribeDetails(tribeId);
    
    // Pre-check tribe requirements
    if (tribeDetails.joinType === 'GATED' && tribeDetails.requirements) {
      const meetsRequirements = await sdk.tribes.checkMembershipEligibility(tribeId);
      if (!meetsRequirements.eligible) {
        displayRequirements(meetsRequirements.missingRequirements);
        return false;
      }
    }
    
    // Attempt to join
    await sdk.tribes.join(tribeId);
    showSuccess('Successfully joined tribe!');
    return true;
  } catch (error) {
    switch (error.code) {
      case 'tribes/not_found':
        showError('This tribe no longer exists');
        break;
      case 'tribes/already_member':
        showNotice('You are already a member of this tribe');
        break;
      case 'tribes/insufficient_funds':
        showError('Insufficient funds to pay the entry fee', {
          details: `Fee: ${error.details.fee} ${error.details.token}`,
          action: {
            label: 'Get Tokens',
            onClick: () => redirectToFaucet()
          }
        });
        break;
      case 'tribes/invite_only':
        showError('This tribe requires an invitation to join');
        break;
      default:
        showError(`Failed to join tribe: ${error.message}`);
    }
    return false;
  }
}
```

### Transaction Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `tx/rejected` | Transaction rejected | User rejected transaction in wallet |
| `tx/failed` | Transaction failed | Smart contract execution error |
| `tx/underpriced` | Transaction underpriced | Gas price too low |
| `tx/timeout` | Transaction timeout | Network congestion or node issues |
| `tx/nonce_error` | Invalid nonce | Multiple pending transactions |

```typescript
// Example: Handle transaction errors
async function handlePointsTransfer(recipient, amount) {
  try {
    // Start with optimistic UI update
    showTransferPending(recipient, amount);
    
    const tx = await sdk.points.transfer({
      to: recipient,
      amount,
      onHash: (hash) => {
        updateTransactionStatus(hash, 'pending');
      }
    });
    
    updateTransactionStatus(tx.hash, 'confirmed');
    return tx;
  } catch (error) {
    // Revert optimistic UI update
    revertTransferPending();
    
    switch (error.code) {
      case 'tx/rejected':
        showNotice('Transaction was rejected in your wallet');
        break;
      case 'tx/failed':
        showError(`Transaction failed: ${error.details?.reason || 'Unknown error'}`);
        break;
      case 'tx/underpriced':
        showError('Transaction failed due to network congestion', {
          action: {
            label: 'Retry with higher gas',
            onClick: () => handlePointsTransfer(recipient, amount)
          }
        });
        break;
      case 'tx/timeout':
        showError('Transaction is taking longer than expected', {
          details: 'It may still complete. Check your wallet for status.',
          action: {
            label: 'View in Explorer',
            onClick: () => openExplorer(error.details?.hash)
          }
        });
        break;
      default:
        showError(`Transfer failed: ${error.message}`);
    }
    return null;
  }
}
```

### Network Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `network/disconnected` | Network disconnected | Internet connection lost |
| `network/rpc_error` | RPC error | RPC endpoint down or rate-limited |
| `network/timeout` | Request timeout | Slow network or unresponsive endpoint |

```typescript
// Example: Handle network errors
function setupNetworkMonitoring(sdk) {
  sdk.on('networkError', (error) => {
    switch (error.code) {
      case 'network/disconnected':
        showOfflineBanner();
        break;
      case 'network/rpc_error':
        console.error('RPC Error:', error.details);
        if (error.details?.includes('rate limit')) {
          switchToBackupRpc();
        }
        break;
      case 'network/timeout':
        showSlowConnectionWarning();
        break;
    }
  });
  
  // Monitor reconnection
  sdk.on('networkReconnected', () => {
    hideOfflineBanner();
    refreshStaleData();
  });
}
```

### Validation Errors

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `validation/invalid_input` | Invalid input | Wrong data type or format |
| `validation/required_field` | Required field missing | Omitting required parameters |
| `validation/max_length` | Exceeded maximum length | Too much text in name/description |
| `validation/invalid_format` | Invalid format | Wrong format for URL, address, etc. |

```typescript
// Example: Validate inputs before SDK calls
function validateTribeCreation(tribeData) {
  const errors = [];
  
  if (!tribeData.name) {
    errors.push({
      code: 'validation/required_field',
      message: 'Tribe name is required',
      field: 'name'
    });
  } else if (tribeData.name.length > 50) {
    errors.push({
      code: 'validation/max_length',
      message: 'Tribe name cannot exceed 50 characters',
      field: 'name'
    });
  }
  
  if (tribeData.description && tribeData.description.length > 500) {
    errors.push({
      code: 'validation/max_length',
      message: 'Description cannot exceed 500 characters',
      field: 'description'
    });
  }
  
  if (tribeData.imageUrl && !isValidUrl(tribeData.imageUrl)) {
    errors.push({
      code: 'validation/invalid_format',
      message: 'Image URL is not a valid URL',
      field: 'imageUrl'
    });
  }
  
  return errors;
}

// Usage
async function createTribe(tribeData) {
  const validationErrors = validateTribeCreation(tribeData);
  
  if (validationErrors.length > 0) {
    displayValidationErrors(validationErrors);
    return null;
  }
  
  try {
    return await sdk.tribes.create(tribeData);
  } catch (error) {
    handleSdkError(error);
    return null;
  }
}
```

## Global Error Handling

For consistent error handling across your application:

```typescript
// Setup global error handler
function setupGlobalErrorHandler(sdk) {
  // Listen for all SDK errors
  sdk.on('error', (error) => {
    // Log all errors
    logErrorToService(error);
    
    // Handle specific global concerns
    if (error.code?.startsWith('auth/')) {
      handleAuthErrors(error);
    } else if (error.code?.startsWith('network/')) {
      handleNetworkErrors(error);
    }
  });
  
  // Handle authentication state changes
  sdk.auth.onAuthStateChanged((state) => {
    if (!state.isAuthenticated && previouslyAuthenticated) {
      // Handle authentication loss
      showSessionExpiredNotification();
    }
  });
}

// Example error handler for React components
function withErrorHandling(Component) {
  return function WithErrorHandling(props) {
    const [error, setError] = useState(null);
    
    useEffect(() => {
      if (error) {
        // Report error to analytics or logging service
        reportError(error);
      }
    }, [error]);
    
    return (
      <>
        {error && (
          <ErrorBanner 
            code={error.code}
            message={error.message}
            onDismiss={() => setError(null)}
          />
        )}
        <Component
          {...props}
          onError={setError}
          clearError={() => setError(null)}
        />
      </>
    );
  };
}

// Usage
const TribeCreationForm = withErrorHandling(({ onError }) => {
  const handleSubmit = async (formData) => {
    try {
      await sdk.tribes.create(formData);
    } catch (error) {
      onError(error);
    }
  };
  
  // Component implementation...
});
```

## Error Localization

For applications supporting multiple languages:

```typescript
// Error message localization
const errorMessages = {
  en: {
    'auth/not_authenticated': 'Please connect your wallet to continue',
    'tribes/not_found': 'Tribe not found',
    // Other error codes...
  },
  es: {
    'auth/not_authenticated': 'Por favor conecta tu billetera para continuar',
    'tribes/not_found': 'Tribu no encontrada',
    // Other error codes...
  }
};

function getLocalizedErrorMessage(error, language = 'en') {
  const messages = errorMessages[language] || errorMessages.en;
  return messages[error.code] || error.message;
}

// Usage
try {
  await sdk.tribes.join(tribeId);
} catch (error) {
  showError(getLocalizedErrorMessage(error, userLanguage));
}
```

## Debugging and Reporting Errors

```typescript
// Enable debug mode
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  debug: true,
  logLevel: 'debug'
});

// Create an error handler with detailed logging
function createErrorHandler() {
  return function handleError(error) {
    // Format error details for logging
    const errorDetails = {
      code: error.code || 'unknown',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      // Add other relevant context
      path: window.location.pathname,
      sdkVersion: sdk.version
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('SDK Error:');
      console.error('Error:', error);
      console.info('Details:', errorDetails);
      
      // If this wrapped another error, log it too
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
      console.groupEnd();
    }
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      reportErrorToService(errorDetails);
    }
    
    // Return formatted error for UI
    return {
      title: getErrorTitle(error),
      message: getErrorMessage(error),
      actions: getErrorActions(error)
    };
  };
}

// Helper to get error suggestions
function getErrorSuggestions(error) {
  const suggestions = {
    'auth/wallet_not_connected': [
      'Make sure you have a wallet extension installed',
      'Click the "Connect Wallet" button to connect',
    ],
    'tx/failed': [
      'Check if you have sufficient funds for gas',
      'Try again with a higher gas limit',
    ],
    // More suggestions...
  };
  
  return suggestions[error.code] || [];
}
```

## Retry Logic

For transient errors that may resolve with retries:

```typescript
// Utility for retry logic
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffFactor = 2,
    retryableErrors = ['network/timeout', 'network/rpc_error'],
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on specific error types
      const shouldRetry = retryableErrors.some(prefix => 
        error.code?.startsWith(prefix)
      );
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff
      const delay = delayMs * Math.pow(backoffFactor, attempt);
      console.info(`Operation failed, retrying in ${delay}ms (${attempt + 1}/${maxRetries})`, error.code);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
async function fetchTribeData(tribeId) {
  return withRetry(
    () => sdk.tribes.getTribeDetails(tribeId),
    {
      maxRetries: 3,
      retryableErrors: ['network/timeout', 'network/rpc_error']
    }
  );
}
```

## Best Practices

1. **Use specific error checks instead of generic catches**
   ```typescript
   // Bad
   try {
     await sdk.tribes.join(tribeId);
   } catch (error) {
     showError('Failed to join tribe');
   }
   
   // Good
   try {
     await sdk.tribes.join(tribeId);
   } catch (error) {
     if (error.code === 'tribes/already_member') {
       showNotice('You are already a member');
     } else if (error.code === 'tribes/not_found') {
       showError('Tribe does not exist');
     } else {
       showError(`Failed to join tribe: ${error.message}`);
     }
   }
   ```

2. **Log detailed errors in development, user-friendly messages in production**
   ```typescript
   function handleError(error) {
     // Always log detailed error for debugging
     console.error('Detailed error:', error);
     
     // Show user-friendly message in UI
     if (process.env.NODE_ENV === 'production') {
       return getUserFriendlyMessage(error.code);
     } else {
       return `${error.code}: ${error.message}`;
     }
   }
   ```

3. **Validate inputs before sending to SDK**
   - Validate data locally before making SDK calls
   - Provide immediate feedback for obviously invalid inputs
   - Save network requests for data that passes basic validation

4. **Handle loading states appropriately**
   ```typescript
   function TribeJoinButton({ tribeId }) {
     const [status, setStatus] = useState('idle'); // idle, loading, success, error
     const [error, setError] = useState(null);
     
     const handleJoin = async () => {
       setStatus('loading');
       setError(null);
       
       try {
         await sdk.tribes.join(tribeId);
         setStatus('success');
       } catch (error) {
         setStatus('error');
         setError(error);
       }
     };
     
     return (
       <div>
         <button 
           onClick={handleJoin} 
           disabled={status === 'loading'}
         >
           {status === 'loading' ? 'Joining...' : 'Join Tribe'}
         </button>
         
         {status === 'error' && (
           <ErrorMessage error={error} />
         )}
       </div>
     );
   }
   ```

5. **Implement application-level error boundaries**
   - Use React Error Boundaries or equivalent to prevent entire app crashes
   - Provide fallback UIs for unexpected errors
   - Log and report unexpected errors to improve code quality

## Further Resources

- [SDK API Reference](../api/index.html) - For detailed error type documentation
- [Example Projects](https://github.com/tribesbyastrix/sdk-examples) - Reference implementations with error handling
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions 