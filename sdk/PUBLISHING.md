# Publishing to npm

This guide outlines the steps to publish the Tribes by Astrix SDK to npm.

## Prerequisites

1. You must have an npm account (create one at https://www.npmjs.com/signup)
2. You need to be authorized with npm on your local machine
3. You should have appropriate permissions for the `tribes-by-astrix-sdk` package

## Preparing for Release

1. Make sure all your changes are committed to the repository
2. Update the version number in `package.json` according to [Semantic Versioning](https://semver.org/)
3. Update the `CHANGELOG.md` (if applicable)
4. Make sure all tests pass and the build is successful:

```bash
# Install dependencies if needed
npm install

# Run tests
npm test

# Run lint check
npm run lint

# Build the package
npm run build
```

## Publishing the Package

### Login to npm

If you haven't logged in to npm on your local machine:

```bash
npm login
```

Follow the prompts to enter your username, password, and email.

### Publishing

Once you're logged in and the package is prepared:

```bash
# For a regular release
npm publish

# For a pre-release (e.g., beta)
npm publish --tag beta
```

### Checking the Published Package

After publishing, verify the package is available on npm:

1. Visit https://www.npmjs.com/package/tribes-by-astrix-sdk
2. Check that the package metadata and version information is correct

## Versioning Guide

- `1.0.0`: Initial stable release
- `1.1.0`: Non-breaking new features
- `1.1.1`: Bug fixes
- `2.0.0`: Breaking changes
- `1.0.0-beta.1`: Pre-release versions

## Unpublishing (Emergency Only)

If you need to unpublish a version (only possible within the first 72 hours):

```bash
npm unpublish tribes-by-astrix-sdk@<version>
```

Note: Unpublishing is discouraged as it may break dependent packages.

## Publishing from CI/CD

For automated publishing via CI/CD:

1. Store npm credentials as secrets in your CI/CD platform
2. Use a release workflow to:
   - Run tests
   - Build the package
   - Publish to npm when tests and build succeed

Example GitHub Actions workflow for publishing:

```yaml
name: Publish Package to npm

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
``` 