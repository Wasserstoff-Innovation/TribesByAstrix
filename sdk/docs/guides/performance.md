# Performance Optimization Guide

This guide provides strategies for optimizing the performance of applications built with the Tribes by Astrix SDK.

## Initialization Optimization

How you initialize the SDK can impact performance:

```typescript
import { TribesSDK } from 'tribes-by-astrix-sdk';

// Optimized initialization
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  cacheOptions: { enabled: true },
  batchEnabled: true,
  lazyConnectContracts: true,
  multicallEnabled: true
});
```

### Key Initialization Options

| Option | Description | Performance Impact |
|--------|-------------|-------------------|
| `lazyConnectContracts` | Only connect to contracts when needed | Reduces initialization time |
| `batchEnabled` | Enables request batching | Reduces RPC calls |
| `multicallEnabled` | Uses multicall for read operations | Reduces blockchain roundtrips |
| `cacheOptions` | Configure caching behavior | Reduces duplicate requests |

## Batching and Multicall

The SDK supports batching multiple read operations into a single call:

```typescript
// Without batching (3 separate calls)
const tribe1 = await sdk.tribes.getTribeDetails(1);
const tribe2 = await sdk.tribes.getTribeDetails(2);
const tribe3 = await sdk.tribes.getTribeDetails(3);

// With batching (1 call)
const [tribe1, tribe2, tribe3] = await sdk.batch([
  sdk.tribes.getTribeDetails(1),
  sdk.tribes.getTribeDetails(2),
  sdk.tribes.getTribeDetails(3)
]);
```

For contract reads, multicall is even more efficient:

```typescript
const tribesData = await sdk.multicall.tribes.getTribeDetailsMulti([1, 2, 3, 4, 5]);
```

## Pagination Strategies

When retrieving large datasets, use pagination:

```typescript
// Inefficient - fetches all tribes
const allTribes = await sdk.tribes.getAllTribes();

// Better - paginated approach
const PAGE_SIZE = 10;
let offset = 0;
let hasMore = true;
const allTribes = [];

while (hasMore) {
  const { tribes, total } = await sdk.tribes.getTribes({
    offset,
    limit: PAGE_SIZE
  });
  
  allTribes.push(...tribes);
  offset += tribes.length;
  hasMore = allTribes.length < total;
}
```

### Virtual Lists

For displaying large lists in UI, consider using virtual lists:

```typescript
// React example with react-window
import { FixedSizeList } from 'react-window';

function TribesList({ tribes }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TribeCard tribe={tribes[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={tribes.length}
      itemSize={120}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Optimizing Real-time Updates

Instead of frequent polling, use event subscriptions:

```typescript
// Inefficient polling approach
setInterval(async () => {
  const points = await sdk.points.getUserPoints(userAddress);
  updateUI(points);
}, 5000);

// Better event-based approach
sdk.events.subscribeToPointsUpdated(userAddress, (points) => {
  updateUI(points);
});

// Don't forget to unsubscribe when done
sdk.events.unsubscribeFromPointsUpdated(userAddress);
```

## Lazy Loading

Load data only when needed:

```typescript
// React example with lazy loading
import { useEffect, useState } from 'react';

function TribeDetails({ tribeId, visible }) {
  const [tribe, setTribe] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    
    // Only fetch if component is visible
    if (visible && !tribe) {
      sdk.tribes.getTribeDetails(tribeId)
        .then(data => {
          if (mounted) setTribe(data);
        });
    }
    
    return () => { mounted = false; };
  }, [tribeId, visible, tribe]);
  
  if (!visible) return null;
  if (!tribe) return <Loading />;
  
  return <TribeView tribe={tribe} />;
}
```

## Gas Optimization

Minimize gas costs for write operations:

```typescript
// Gas optimization techniques

// 1. Batch transfers instead of multiple transfers
// Instead of:
await sdk.points.awardPoints(user1, 10);
await sdk.points.awardPoints(user2, 20);
await sdk.points.awardPoints(user3, 30);

// Do this:
await sdk.points.batchAwardPoints([
  { user: user1, amount: 10 },
  { user: user2, amount: 20 },
  { user: user3, amount: 30 }
]);

// 2. Use estimateGas before transactions
const estimatedGas = await sdk.tribes.estimateGasCreateTribe(tribeData);
console.log(`Estimated gas: ${estimatedGas}`);

// 3. Optimize transaction speed/cost with custom gas settings
await sdk.tribes.createTribe(tribeData, {
  gasLimit: estimatedGas.mul(120).div(100), // 20% buffer
  maxFeePerGas: ethers.parseUnits('50', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('1.5', 'gwei')
});
```

## Asset Loading and Optimization

For media assets, implement efficient loading strategies:

```typescript
// Lazy load post media
async function loadPostMedia(post) {
  // Only fetch media when post is in viewport
  if (isInViewport(postElement)) {
    const mediaURIs = JSON.parse(post.metadata).media || [];
    
    // Use thumbnail previews first
    const thumbnail = await sdk.content.getOptimizedMediaURI(mediaURIs[0], { 
      width: 300, 
      quality: 70 
    });
    
    // Display thumbnail immediately
    setPostThumbnail(thumbnail);
    
    // Load full resolution in background
    sdk.content.getMediaURI(mediaURIs[0]).then(fullRes => {
      setPostFullMedia(fullRes);
    });
  }
}
```

## Offline Support

Implement offline capabilities:

```typescript
// Service worker registration for offline caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Detect online/offline status
window.addEventListener('online', () => {
  sdk.setNetworkStatus('online');
});

window.addEventListener('offline', () => {
  sdk.setNetworkStatus('offline');
});

// Queue operations when offline
async function createPost(postData) {
  try {
    return await sdk.content.createPost(postData);
  } catch (error) {
    if (!navigator.onLine) {
      sdk.queue.add('createPost', postData);
      return { queued: true, id: 'pending-' + Date.now() };
    }
    throw error;
  }
}

// Process queue when back online
window.addEventListener('online', () => {
  sdk.queue.processAll().then(results => {
    console.log('Processed queued operations:', results);
  });
});
```

## Memory Management

Handle memory efficiently, especially for long-running applications:

```typescript
// Clean up event listeners
useEffect(() => {
  const subscription = sdk.events.subscribeToTribeUpdated(
    tribeId, 
    handleTribeUpdate
  );
  
  return () => {
    // Important: Clean up to prevent memory leaks
    subscription.unsubscribe();
  };
}, [tribeId]);

// Release large resources when not needed
function cleanUpResources() {
  // Clear in-memory caches for large datasets
  sdk.cache.deleteByPattern('media:*');
  
  // Force garbage collection in some environments
  if (global.gc) {
    global.gc();
  }
}
```

## RPC Provider Selection

Choose the right RPC provider for your needs:

```typescript
// For high-volume production apps
const sdk = new TribesSDK({
  rpcUrl: 'https://premium-rpc-provider.com',
  fallbackRpcUrls: [
    'https://backup-rpc-1.com',
    'https://backup-rpc-2.com'
  ],
  rpcStrategy: 'round-robin', // or 'fallback'
});

// Monitor RPC performance
sdk.onRpcError((error, providerUrl) => {
  console.error(`RPC error with provider ${providerUrl}:`, error);
  reportToMonitoring(error, providerUrl);
});
```

## Network Optimization

Reduce network overhead:

```typescript
// Use compressed responses
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  httpClientOptions: {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br'
    },
    keepAlive: true,
    timeout: 30000 // 30 seconds
  }
});

// Implement retry logic for network failures
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  }
});
```

## Monitoring and Profiling

Set up monitoring to identify performance bottlenecks:

```typescript
// Enable debug mode for performance metrics
const sdk = new TribesSDK({
  rpcUrl: 'https://rpc-url.com',
  debug: true,
  metrics: true
});

// Get performance metrics
const metrics = sdk.getMetrics();
console.log('Average call duration:', metrics.averageCallDuration);
console.log('Cache hit ratio:', metrics.cacheHitRatio);
console.log('RPC calls count:', metrics.rpcCallsCount);

// Log slow operations
sdk.on('slowOperation', (operation, duration) => {
  console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
});
```

## Further Resources

- [Caching Guide](./caching.md) for detailed caching strategies
- [API Reference](../api/index.html) for comprehensive SDK documentation
- [Ethers.js Documentation](https://docs.ethers.org/) for advanced gas optimization techniques 