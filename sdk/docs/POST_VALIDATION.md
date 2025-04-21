# Post Validation in Tribes by Astrix SDK

This document explains how post validation works in the Tribes by Astrix SDK, common issues you might encounter, and how to ensure your post data meets validation requirements.

## Overview

The Tribes by Astrix platform implements robust validation for post content to ensure data integrity and proper content structure. When creating posts through the SDK, your metadata must conform to specific requirements based on the post type.

## Post Types and Required Fields

Each post type has specific required fields that must be included in the metadata:

| Post Type | Required Fields | Description |
|-----------|----------------|-------------|
| TEXT      | content        | Basic text-only posts |
| IMAGE     | content, mediaUrl | Posts with image media |
| ARTICLE   | title, content | Longer form content |
| POLL      | title, options | Interactive polls |
| EVENT     | title, startDate, location | Event announcements |
| RICH_MEDIA | title, content, mediaContent | Posts with multiple media types |
| COMMUNITY_UPDATE | title, content, communityDetails | Updates about community |
| PROJECT_UPDATE | title, content, projectDetails | Updates about projects |

## Validation Process

When creating a post through the SDK, validation happens in two places:

1. **Client-side (SDK)**: Preliminary validation happens in the SDK to catch obvious issues before sending transactions
2. **Contract-side**: The PostMinter contract performs thorough validation before post creation

### Example of Validation in SDK

```typescript
import { AstrixSDK } from 'tribes-by-astrix-sdk';

// Initialize SDK
const sdk = new AstrixSDK({
  provider,
  chainId: 125999 // Monad Devnet
});

// Create a post with proper validation
async function createTextPost() {
  try {
    // This will be validated before submission
    const result = await sdk.posts.createPost({
      communityId: 1,
      postType: "TEXT",
      metadata: {
        content: "This is a valid text post"
      }
    });
    
    console.log("Post created successfully:", result);
  } catch (error) {
    if (error.message.includes('INVALID_METADATA')) {
      console.error("Post metadata validation failed:", error.message);
    } else {
      console.error("Error creating post:", error);
    }
  }
}
```

## Common Validation Issues

### 1. Missing Required Fields

**Issue**: The metadata is missing fields required for the specified post type.

**Solution**: Ensure all required fields for the post type are included.

```typescript
// ❌ INVALID - Missing required field
const invalidMetadata = {
  // Missing 'content' field for TEXT post type
};

// ✅ VALID
const validMetadata = {
  content: "This is the post content"
};
```

### 2. Invalid Post Type

**Issue**: The post type specified is not supported.

**Solution**: Use one of the supported post types (TEXT, IMAGE, ARTICLE, etc.).

```typescript
// ❌ INVALID - Unsupported post type
await sdk.posts.createPost({
  communityId: 1,
  postType: "UNKNOWN_TYPE", // Invalid type
  metadata: { content: "Test" }
});

// ✅ VALID
await sdk.posts.createPost({
  communityId: 1,
  postType: "TEXT", // Valid type
  metadata: { content: "Test" }
});
```

### 3. Invalid JSON Format

**Issue**: The metadata cannot be properly parsed as JSON.

**Solution**: Ensure metadata is a valid JavaScript object with proper formatting.

```typescript
// ❌ INVALID - Malformed data
const invalidData = {
  content: function() { return "test"; } // Functions can't be serialized
};

// ✅ VALID
const validData = {
  content: "This is valid content"
};
```

### 4. Exceeding Size Limits

**Issue**: The metadata exceeds size limits imposed by the contract.

**Solution**: Keep metadata concise and within size limits.

```typescript
// ❌ INVALID - Too large
const invalidMetadata = {
  content: "A".repeat(50000) // Exceeds size limit
};

// ✅ VALID
const validMetadata = {
  content: "This is a reasonably sized post"
};
```

## Debugging Validation Issues

If you're encountering validation issues, you can use the SDK's validation utilities to debug before submitting transactions:

```typescript
// Validate metadata for a specific post type
const isValid = await sdk.posts.validatePostMetadata(metadata, "TEXT");
if (!isValid) {
  console.error("Invalid metadata for TEXT post type");
}

// Get detailed validation errors
try {
  await sdk.posts.validatePostMetadata(metadata, "TEXT");
} catch (error) {
  console.error("Validation error:", error.message);
  // Error message will indicate what's missing or invalid
}
```

## Testing Post Validation

You can run specific tests for post validation using the following command:

```bash
npm run test:post-validation
```

This command runs only the post validation tests, helping you verify that your changes work as expected without running the entire test suite.

## Integration with UI Forms

When building UI forms for post creation, implement client-side validation that matches the contract requirements:

```typescript
function validateForm(formData, postType) {
  const requiredFields = {
    TEXT: ['content'],
    IMAGE: ['content', 'mediaUrl'],
    ARTICLE: ['title', 'content'],
    // ... other post types
  };
  
  // Check if all required fields for this post type are present and not empty
  const missingFields = requiredFields[postType].filter(
    field => !formData[field] || formData[field].trim() === ''
  );
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  return { valid: true };
}
```

## Best Practices

1. **Always validate client-side**: Catch validation issues before sending transactions
2. **Handle validation errors gracefully**: Provide clear feedback to users when validation fails
3. **Keep metadata concise**: Only include necessary data to reduce gas costs
4. **Use SDK validation utilities**: Use built-in validation methods in the SDK
5. **Test thoroughly**: Use the post validation test script to verify your changes

## Need Help?

If you encounter issues with post validation that aren't covered in this guide, consult the [Troubleshooting Guide](./TROUBLESHOOTING.md) or reach out to the Tribes by Astrix support team.

---

*This documentation is regularly updated as new post types and validation rules are added to the platform.* 