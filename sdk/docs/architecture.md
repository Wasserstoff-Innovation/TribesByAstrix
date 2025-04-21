# Architecture Overview

This document provides an overview of the Tribes by Astrix SDK architecture, explaining the design decisions and how the different components work together.

## High-Level Architecture

The SDK follows a modular architecture that separates concerns and provides a clear organization of functionality:

```
┌─────────────────────────────────────────────────────┐
│                    AstrixSDK                        │
├─────────┬─────────┬─────────┬──────────┬────────────┤
│ Tribes  │ Content │ Points  │  Token   │   Other    │
│ Module  │ Module  │ Module  │  Module  │  Modules   │
├─────────┴─────────┴─────────┴──────────┴────────────┤
│                    BaseModule                       │
├─────────────────────────────────────────────────────┤
│                 Ethereum Provider                   │
└─────────────────────────────────────────────────────┘
```

### Main Components

1. **AstrixSDK Class**: 
   - Core entry point for the SDK
   - Manages provider connection and signer
   - Initializes and coordinates all modules

2. **BaseModule Class**:
   - Abstract base class that all modules extend
   - Provides shared functionality like contract interaction
   - Handles error management and logging

3. **Specialized Modules**:
   - **Tribes Module**: Tribe creation and management
   - **Content Module**: Posts, comments, and content
   - **Points Module**: Points and rewards systems
   - **Token Module**: Astrix token interactions
   - **Profiles Module**: User profile management
   - **Organizations Module**: Organization management
   - **Analytics Module**: Usage analytics and statistics

## Initialization Flow

When you initialize the SDK, the following sequence occurs:

1. The SDK instance is created with configuration options
2. The provider is initialized (either from URL or provider instance)
3. All modules are instantiated with references to the provider
4. When a signer is connected, it's passed to all modules

```typescript
// Initialization flow
const sdk = new AstrixSDK({
  provider: window.ethereum,
  contracts: { ... },
  // other options
});

// Later, connect a signer
await sdk.connect(signer);
```

## Module Design

Each module follows a consistent pattern:

### Module Structure

```typescript
export class SomeModule extends BaseModule {
  // Private methods for internal operations
  private getContractInstance() { ... }
  
  // Public methods that represent the module's API
  public async someOperation(params) { ... }
  
  // Helper methods for common tasks
  private formatData(data) { ... }
}
```

### Error Handling

Modules use a standardized error handling approach:

```typescript
try {
  // Operation code
} catch (error) {
  return this.handleError(
    error,
    'Human-readable error message',
    ErrorType.CONTRACT_ERROR
  );
}
```

The error handler creates standardized error objects with:
- Error type (CONTRACT_ERROR, VALIDATION_ERROR, etc.)
- Human-readable message
- Original error details
- Additional context

## Data Flow

### Reading Data

1. User calls a read method on a module
2. Module gets the appropriate contract instance
3. Contract calls are made with the provider
4. Results are parsed and formatted to match SDK types
5. Data is returned to the user

### Writing Data

1. User calls a write method on a module
2. Input validation is performed
3. Module gets the contract instance with signer
4. Transaction is submitted to the blockchain
5. Module waits for transaction receipt
6. Receipt is parsed for events and relevant data
7. Results are returned to the user

## Contract Interactions

The SDK wraps Ethereum contract interactions with a more developer-friendly API:

### Contract Instantiation

```typescript
// Inside a module method
const contract = this.getContract(
  this.config.contracts.someContract,
  SomeContractABI,
  true // Use signer if available
);
```

### Reading From Contracts

```typescript
// Reading from contracts
const result = await contract.someMethod(...args);
// Format the result for user consumption
return this.formatResult(result);
```

### Writing To Contracts

```typescript
// Writing to contracts
const tx = await contract.someWriteMethod(...args);
const receipt = await tx.wait();
// Extract events and other data from the receipt
return this.parseReceipt(receipt);
```

## Type System

The SDK uses TypeScript for type safety throughout:

1. **Core Types**: Configuration, errors, and shared types
2. **Module-specific Types**: Input/output types for each module
3. **Contract Types**: Types that match the blockchain contract structures

Types help ensure correct usage and provide IDE auto-completion.

## Extension and Customization

The SDK supports extension and customization through:

1. **Module composition**: Use only the modules you need
2. **Configuration options**: Customize behavior with configuration
3. **Subclassing**: You can extend modules with custom functionality

```typescript
// Extending a module
class CustomTribesModule extends TribesModule {
  async myCustomMethod() {
    // Custom implementation
  }
}
```

## Performance Considerations

The SDK is designed with performance in mind:

1. **Lazy Loading**: Contracts are instantiated only when needed
2. **Batch Operations**: Support for batch operations where applicable
3. **Efficient Parsing**: Smart parsing of blockchain data
4. **Caching Support**: Built with caching strategies in mind

## Security Design

Key security features of the SDK:

1. **Input Validation**: Extensive validation to prevent errors
2. **Type Safety**: TypeScript types prevent many common mistakes
3. **Role Checking**: Validation of user roles before operations
4. **Error Handling**: Comprehensive error handling to prevent unexpected behavior
5. **No Private Key Storage**: The SDK never stores private keys

## Interoperability

The SDK is designed to work with:

1. **Frontend Frameworks**: React, Vue, Angular
2. **Backend Systems**: Node.js environments
3. **Mobile**: React Native and other mobile frameworks

## File Structure

The SDK source code is organized as follows:

```
src/
├── core/              # Core SDK components
│   ├── AstrixSDK.ts   # Main SDK class
│   └── BaseModule.ts  # Base module class
├── modules/           # Specialized modules
│   ├── tribes.ts      # Tribes functionality
│   ├── content.ts     # Content management
│   ├── points.ts      # Points system
│   └── token.ts       # Token interactions
├── types/             # TypeScript type definitions
│   ├── core.ts        # Core types
│   ├── tribes.ts      # Tribe-related types
│   ├── content.ts     # Content-related types
│   └── errors.ts      # Error types
├── utils/             # Utility functions
│   ├── formatting.ts  # Data formatting
│   ├── validation.ts  # Input validation
│   └── signatures.ts  # Cryptographic utilities
└── index.ts           # Main export file
```

## Technical Decisions

### Why ethers.js?

The SDK uses ethers.js rather than web3.js because:
- More modern API design
- Better TypeScript support
- Smaller bundle size
- More comprehensive features for providers and signers

### Why Module-Based Architecture?

A module-based architecture was chosen to:
- Separate concerns clearly
- Allow users to use only what they need
- Make the codebase more maintainable
- Support future extensions

### Why TypeScript?

TypeScript provides:
- Type safety during development
- Better IDE support with auto-completion
- Self-documenting code
- Easier maintenance

## Conclusion

The Tribes by Astrix SDK is designed to be:
- **Modular**: Use only what you need
- **Type-safe**: Prevent common errors
- **Extensible**: Build on top of it
- **Well-documented**: Easy to understand and use
- **Performant**: Efficient for production use

This architecture enables developers to integrate with the Tribes by Astrix platform seamlessly while providing the flexibility to adapt to different use cases and environments. 