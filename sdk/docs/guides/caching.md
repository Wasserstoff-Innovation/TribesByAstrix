# Caching and State Management

This guide explains how to efficiently manage state and implement caching strategies when using the Tribes by Astrix SDK.

## Overview

The SDK provides built-in caching mechanisms to:

- Reduce redundant network requests
- Minimize gas costs
- Improve application performance
- Enhance user experience with faster load times

## Built-in Caching

The SDK implements several automatic caching mechanisms:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Initialize SDK with caching options
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: {
    enabled: true,              // Enable caching (default: true)
    ttl: 60 * 1000,             // Default TTL in ms (default: 60 seconds)
    maxEntries: 1000,           // Maximum number of cache entries (default: 1000)
    persistToLocalStorage: true // Save cache to localStorage (default: false)
  }
});
```

### Cached Operations

The following operations are automatically cached by the SDK:

| Operation | Default TTL | Description |
|-----------|-------------|-------------|
| `getAllTribes()` | 60 seconds | List of tribes |
| `getTribeDetails()` | 30 seconds | Individual tribe details |
| `getMemberCount()` | 60 seconds | Number of members in a tribe |
| `getUserPoints()` | 30 seconds | User's point balance |
| `getUserTribes()` | 60 seconds | List of tribes a user belongs to |
| Contract metadata | 24 hours | Contract ABIs, addresses, etc. |

### Controlling Cache Behavior

You can bypass the cache for specific calls:

```typescript
// Force fresh data
const tribes = await sdk.tribes.getAllTribes({ bypassCache: true });

// For a specific tribe
const tribeDetails = await sdk.tribes.getTribeDetails(tribeId, { 
  bypassCache: true 
});
```

Or adjust TTL for specific calls:

```typescript
// Cache this result for 5 minutes
const members = await sdk.tribes.getTribeMembers(tribeId, {
  cacheOptions: { ttl: 5 * 60 * 1000 }
});
```

## Manual Cache Management

Control cache behavior programmatically:

```typescript
// Clear the entire cache
sdk.cache.clear();

// Clear specific cache entries
sdk.cache.invalidate('tribes');
sdk.cache.invalidate(`tribe:${tribeId}`);

// Add or update cache entries manually
sdk.cache.set(`tribe:${tribeId}`, tribeData, 120 * 1000); // 2 minutes TTL

// Get cached data
const cachedTribe = sdk.cache.get(`tribe:${tribeId}`);
if (cachedTribe) {
  console.log('Using cached tribe data');
  return cachedTribe;
}
```

## Cache Invalidation Strategies

### Automatic Invalidation

The SDK automatically invalidates cache entries in these scenarios:

- After successful write operations to related resources
- When the SDK detects relevant blockchain events
- When the TTL for the cache entry expires

For example:

```typescript
// This will automatically invalidate related cache entries
await sdk.tribes.updateTribe(tribeId, {
  name: 'New Tribe Name',
  description: 'Updated description'
});

// Cache for getTribeDetails(tribeId) is now invalid and will be refreshed
// on the next request
```

### Manual Invalidation Patterns

For complex applications, implement custom invalidation logic:

```typescript
// Clear tribe cache on specific user actions
async function handleTribeUpdate(tribeId, newData) {
  await sdk.tribes.updateTribe(tribeId, newData);
  
  // Explicitly invalidate related caches
  sdk.cache.invalidate(`tribe:${tribeId}`);
  sdk.cache.invalidate('allTribes');
  sdk.cache.invalidate(`tribeMembers:${tribeId}`);
  
  // Refetch data if needed
  return sdk.tribes.getTribeDetails(tribeId, { bypassCache: true });
}
```

## Optimistic Updates

Implement optimistic UI updates for a responsive experience:

```typescript
async function awardPointsOptimistic(userId, amount) {
  // Get current point balance
  const currentBalance = await sdk.points.getUserPoints(userId);
  
  // Optimistically update the UI
  updateUserPointsUI(userId, currentBalance + amount);
  
  try {
    // Perform the actual transaction
    const tx = await sdk.points.awardPoints(userId, amount);
    
    // Show pending state
    showPendingTransaction(tx.hash);
    
    // Wait for confirmation
    await tx.wait(1);
    
    // Update UI with the real value (might be different due to network conditions)
    const actualBalance = await sdk.points.getUserPoints(userId, { bypassCache: true });
    updateUserPointsUI(userId, actualBalance);
    
    return { success: true, balance: actualBalance };
  } catch (error) {
    // Revert optimistic update on failure
    updateUserPointsUI(userId, currentBalance);
    
    // Show error
    showError(`Failed to award points: ${error.message}`);
    
    return { success: false, error };
  }
}
```

## Local Storage Persistence

Configure the SDK to persist cache between sessions:

```typescript
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: {
    persistToLocalStorage: true,
    localStorageKey: 'tribes-sdk-cache'
  }
});

// You can also manually persist and restore
function saveCache() {
  const cacheData = sdk.cache.export();
  localStorage.setItem('my-custom-cache-key', JSON.stringify(cacheData));
}

function restoreCache() {
  const cacheData = localStorage.getItem('my-custom-cache-key');
  if (cacheData) {
    sdk.cache.import(JSON.parse(cacheData));
  }
}
```

## State Management with Frontend Frameworks

### React Integration

```tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Create SDK context
const SDKContext = createContext(null);

// SDK provider
export function SDKProvider({ children, rpcUrl }) {
  const [sdk, setSDK] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function initSDK() {
      try {
        const sdkInstance = new TribesSDK({
          rpcUrl,
          cacheOptions: { 
            persistToLocalStorage: true,
            ttl: 120 * 1000 // 2 minutes
          }
        });
        
        // Initialize SDK
        await sdkInstance.init();
        setSDK(sdkInstance);
      } catch (error) {
        console.error('Failed to initialize SDK:', error);
      } finally {
        setLoading(false);
      }
    }
    
    initSDK();
    
    // Clean up on unmount
    return () => {
      if (sdk) {
        sdk.destroy();
      }
    };
  }, [rpcUrl]);
  
  return (
    <SDKContext.Provider value={{ sdk, loading }}>
      {children}
    </SDKContext.Provider>
  );
}

// Custom hook to use the SDK
export function useSDK() {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within an SDKProvider');
  }
  return context;
}

// Example usage with React Query for additional caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Data fetching hook
export function useTribeDetails(tribeId) {
  const { sdk, loading } = useSDK();
  
  return useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: async () => {
      if (!sdk) return null;
      return sdk.tribes.getTribeDetails(tribeId);
    },
    enabled: !loading && !!sdk && !!tribeId,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
}

// Mutation hook with cache invalidation
export function useUpdateTribe() {
  const { sdk } = useSDK();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tribeId, data }) => {
      return sdk.tribes.updateTribe(tribeId, data);
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries(['tribe', variables.tribeId]);
      queryClient.invalidateQueries(['tribes']);
    }
  });
}
```

### Vue Integration

```js
// store/sdk.js
import { defineStore } from 'pinia';
import { TribesSDK } from 'tribes-by-astrix-sdk';

export const useSDKStore = defineStore('sdk', {
  state: () => ({
    sdk: null,
    loading: true,
    error: null
  }),
  
  actions: {
    async initSDK(rpcUrl) {
      this.loading = true;
      this.error = null;
      
      try {
        const sdk = new TribesSDK({
          rpcUrl,
          cacheOptions: {
            persistToLocalStorage: true
          }
        });
        
        await sdk.init();
        this.sdk = sdk;
      } catch (error) {
        this.error = error.message;
        console.error('Failed to initialize SDK:', error);
      } finally {
        this.loading = false;
      }
    },
    
    clearCache() {
      if (this.sdk) {
        this.sdk.cache.clear();
      }
    }
  }
});

// Component usage
<script setup>
import { onMounted, ref } from 'vue';
import { useSDKStore } from '@/store/sdk';
import { storeToRefs } from 'pinia';

const sdkStore = useSDKStore();
const { sdk, loading } = storeToRefs(sdkStore);
const tribes = ref([]);
const loadingTribes = ref(false);

async function loadTribes() {
  if (!sdk.value) return;
  
  loadingTribes.value = true;
  try {
    tribes.value = await sdk.value.tribes.getAllTribes();
  } catch (error) {
    console.error('Failed to load tribes:', error);
  } finally {
    loadingTribes.value = false;
  }
}

onMounted(async () => {
  if (!sdk.value) {
    await sdkStore.initSDK('https://rpc-url.com');
  }
  loadTribes();
});
</script>
```

## Advanced Caching Strategies

### Different TTLs by Resource Type

```typescript
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: {
    ttl: 60 * 1000, // Default 1 minute
    resourceTTL: {
      'tribe': 2 * 60 * 1000,      // 2 minutes for tribe details
      'tribes': 5 * 60 * 1000,     // 5 minutes for all tribes list
      'points': 30 * 1000,         // 30 seconds for points (more volatile)
      'members': 3 * 60 * 1000,    // 3 minutes for member lists
      'transactions': 24 * 60 * 60 * 1000 // 24 hours for transaction history
    }
  }
});
```

### Implementing a Custom Cache Adapter

The SDK supports custom cache adapters for specific needs:

```typescript
// Custom Redis-backed cache adapter
class RedisCacheAdapter {
  constructor(redisClient) {
    this.redis = redisClient;
    this.prefix = 'tribes-sdk:';
  }

  async get(key) {
    const data = await this.redis.get(this.prefix + key);
    if (!data) return null;
    
    const item = JSON.parse(data);
    if (item.expires < Date.now()) {
      await this.remove(key);
      return null;
    }
    
    return item.value;
  }

  async set(key, value, ttl) {
    const item = {
      value,
      expires: Date.now() + (ttl || 60 * 1000)
    };
    
    await this.redis.set(
      this.prefix + key, 
      JSON.stringify(item),
      'PX',
      ttl
    );
  }

  async remove(key) {
    await this.redis.del(this.prefix + key);
  }

  async clear() {
    const keys = await this.redis.keys(this.prefix + '*');
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }
}

// Use the custom adapter
import Redis from 'ioredis';
const redisClient = new Redis();

const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheAdapter: new RedisCacheAdapter(redisClient)
});
```

## WebSocket for Real-time Updates

When requiring real-time updates beyond caching:

```typescript
// Initialize SDK with WebSocket support
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  wsUrl: 'wss://ws-url.com',
  enableRealTimeUpdates: true
});

// Subscribe to specific events
const unsubscribe = sdk.events.subscribe('TribeCreated', (event) => {
  console.log('New tribe created:', event.tribeId);
  
  // Invalidate related cache
  sdk.cache.invalidate('tribes');
  
  // Update UI
  addNewTribeToUI(event);
});

// Subscribe to all events for a specific tribe
sdk.events.subscribeTribe(tribeId, (event) => {
  console.log(`Event for tribe ${tribeId}:`, event);
  
  // Invalidate tribe cache
  sdk.cache.invalidate(`tribe:${tribeId}`);
  
  // Update UI based on event type
  handleTribeEvent(event);
});

// Clean up subscriptions when done
unsubscribe();
sdk.events.unsubscribeAll();
```

## Offline Support and Sync

Implement offline capabilities with SDK:

```typescript
// Enable offline support
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  offlineOptions: {
    enabled: true,
    syncWhenOnline: true,
    queueLimit: 50 // Max number of queued operations
  }
});

// Check connection status
const isOnline = sdk.network.isOnline();
sdk.network.onStatusChange((online) => {
  console.log('Network status changed:', online ? 'online' : 'offline');
  updateNetworkStatusUI(online);
});

// Queue operations for offline use
async function createTribeWhenPossible(tribeData) {
  try {
    const result = await sdk.tribes.createTribe(tribeData);
    return result;
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      // Queue the operation for when we're back online
      sdk.queue.add('createTribe', tribeData);
      
      // Add to UI with pending status
      addPendingTribeToUI(tribeData);
      
      return {
        pending: true,
        message: 'Tribe will be created when back online'
      };
    }
    throw error;
  }
}

// Access the offline queue
const pendingOperations = sdk.queue.getAll();
console.log(`${pendingOperations.length} operations pending`);

// Process queue manually
const processResult = await sdk.queue.process();
console.log(`Processed ${processResult.completed.length} operations`);
console.log(`Failed: ${processResult.failed.length} operations`);
```

## Performance Monitoring

Track and optimize cache performance:

```typescript
// Enable cache performance metrics
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: {
    collectMetrics: true
  }
});

// Get cache metrics
const metrics = sdk.cache.getMetrics();
console.log('Cache hit rate:', metrics.hitRate);
console.log('Average response time saved:', metrics.avgResponseTimeSaved, 'ms');
console.log('Total cache hits:', metrics.hits);
console.log('Total cache misses:', metrics.misses);

// Reset metrics
sdk.cache.resetMetrics();

// Set up monitoring
sdk.setPerformanceCallback((eventName, duration, metadata) => {
  console.log(`Operation ${eventName} took ${duration}ms`, metadata);
  
  // Send to analytics service
  analytics.trackPerformance(eventName, duration, metadata);
});
```

## Best Practices

### Optimizing Cache Usage

1. **Set appropriate TTLs**
   - Short TTLs (seconds) for frequently changing data
   - Longer TTLs (minutes/hours) for static data
   - No TTL for constant data like contract addresses

2. **Preload critical data**
   ```typescript
   async function preloadData() {
     const [tribes, user, globalStats] = await Promise.all([
       sdk.tribes.getAllTribes(),
       sdk.users.getCurrentUser(),
       sdk.stats.getGlobalStats()
     ]);
     
     return { ready: true, tribes, user, globalStats };
   }
   ```

3. **Implement stale-while-revalidate pattern**
   ```typescript
   async function getTribeWithRefresh(tribeId) {
     // Get from cache immediately (might be stale)
     const cachedTribe = sdk.cache.get(`tribe:${tribeId}`);
     
     if (cachedTribe) {
       // Return cached data immediately
       renderTribe(cachedTribe);
       
       // Refresh in background if older than 5 minutes
       const cacheAge = Date.now() - (cachedTribe._cachedAt || 0);
       if (cacheAge > 5 * 60 * 1000) {
         // Refresh in background
         sdk.tribes.getTribeDetails(tribeId, { bypassCache: true })
           .then(freshData => {
             renderTribe(freshData);
           })
           .catch(err => console.error('Background refresh failed:', err));
       }
       
       return cachedTribe;
     }
     
     // No cache hit, fetch fresh data
     return sdk.tribes.getTribeDetails(tribeId);
   }
   ```

4. **Bundle related requests**
   ```typescript
   // Instead of multiple separate requests:
   const tribe = await sdk.tribes.getTribeDetails(tribeId);
   const members = await sdk.tribes.getTribeMembers(tribeId);
   const posts = await sdk.posts.getTribePosts(tribeId);
   
   // Use a bundled request:
   const { tribe, members, posts } = await sdk.tribes.getTribeWithDetails(tribeId);
   ```

### Memory Considerations

To prevent memory leaks when using caching:

```typescript
// Limit cache size
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: {
    maxEntries: 500,      // Limit total entries
    maxSize: 5 * 1024 * 1024 // Limit to 5MB
  }
});

// Clean up when done with a specific section
function cleanupTribeResources(tribeId) {
  // Clear specific cache entries
  sdk.cache.invalidate(`tribe:${tribeId}`);
  sdk.cache.invalidate(`tribeMembers:${tribeId}`);
  sdk.cache.invalidate(`tribePosts:${tribeId}`);
  
  // Unsubscribe from events
  sdk.events.unsubscribeTribe(tribeId);
}
```

## Further Resources

- [Performance Optimization Guide](./performance.md) - For additional performance tips
- [SDK API Reference](../api/index.html) - For detailed method documentation
- [Events and Webhooks Guide](./events.md) - For real-time update information 