module.exports = {
  skipFiles: ['test/', 'scripts/'],
  outputDir: './reports/coverage',
  testCommand: 'npx hardhat test',
  mocha: {
    timeout: 60000
  }
}; 