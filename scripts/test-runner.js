#!/usr/bin/env node

/**
 * Tribes by Astrix Test Runner
 * 
 * This script is designed to run tests for the Tribes by Astrix platform.
 * It captures test results, formats them, generates a JSON report, and
 * optionally serves an HTML visualization of the results.
 * 
 * Commands:
 *   - Run all tests: node scripts/test-runner.js
 *   - Run unit tests: node scripts/test-runner.js unit
 *   - Run integration tests: node scripts/test-runner.js integration
 *   - Run journey tests: node scripts/test-runner.js journey
 *   - Serve HTML report: node scripts/test-runner.js --serve [port]
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Paths for reports and results
const REPORTS_DIR = path.resolve('reports');
const REPORT_FILE = path.join(REPORTS_DIR, 'test-results.json');
const REPORT_CSV = path.join(REPORTS_DIR, 'test-results.csv');

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args.find(arg => ['unit', 'integration', 'journey', 'all'].includes(arg)) || 'all';
const shouldServe = args.includes('--serve');
const port = args.find(arg => /^\d+$/.test(arg) && arg !== '0') || '3000';

// SERVING MODE: Serve the HTML report if --serve flag is passed
if (shouldServe) {
  console.log(`${colors.yellow}Starting server to serve test reports on port ${port}...${colors.reset}`);
  serveResults(port);
  return;
}

/**
 * Generate a report from the test results
 * @param {Object} results - The test results object
 */
function generateReport(results) {
  // Create CSV report
  generateCsvReport(results);
  
  // Write JSON report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
  
  // Log summary
  console.log(`\n${colors.blue}Test Report Summary:${colors.reset}`);
  console.log(`${colors.cyan}Total Tests: ${results.stats.tests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.stats.passes}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.stats.failures}${colors.reset}`);
  console.log(`${colors.yellow}Duration: ${(results.stats.duration / 1000).toFixed(2)}s${colors.reset}`);
}

/**
 * Generate a CSV report from the test results
 * @param {Object} results - The test results object
 */
function generateCsvReport(results) {
  let csv = 'Suite,Test,Status,Duration (ms)\n';
  results.results.forEach(suite => {
    suite.tests.forEach(test => {
      csv += `"${suite.title}","${test.title}","${test.state === 'passed' ? 'PASS' : 'FAIL'}",${test.duration}\n`;
    });
  });
  fs.writeFileSync(REPORT_CSV, csv);
}

/**
 * Run the tests with the specified test type
 * @param {string} type - The type of tests to run ('unit', 'integration', 'journey', 'all')
 */
async function runTests(type) {
  console.log(`${colors.blue}Running ${type} tests...${colors.reset}`);
  
  let testCommand = 'npx hardhat test';
  if (type !== 'all') {
    testCommand += ` test/${type}/*.test.ts`;
  }
  
  return new Promise((resolve, reject) => {
    // Run tests and capture output
    const testProcess = spawn('npx', ['hardhat', 'test', ...(type !== 'all' ? [`test/${type}/**/*.test.ts`] : [])], {
      env: {
        ...process.env,
        REPORT_JSON: '1' // tell Hardhat to output JSON reporter results
      }
    });
    
    let jsonOutput = '';
    let stdOutput = '';
    
    // Capture stdout
    testProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      stdOutput += dataStr;
      process.stdout.write(dataStr);
      
      // Look for JSON output marker
      if (dataStr.includes('JSON_REPORT_START')) {
        jsonOutput = '';
      } else if (dataStr.includes('JSON_REPORT_END')) {
        // End of JSON output, do nothing here
      } else if (jsonOutput !== null) {
        jsonOutput += dataStr;
      }
    });
    
    // Capture stderr
    testProcess.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    
    // Handle process exit
    testProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}Tests failed with exit code ${code}${colors.reset}`);
      }
      
      try {
        // Parse test results from standard output if JSON output wasn't captured
        if (!jsonOutput) {
          const results = parseTestOutput(stdOutput);
          resolve(results);
        } else {
          const jsonResults = JSON.parse(jsonOutput);
          resolve(jsonResults);
        }
      } catch (error) {
        console.error(`${colors.red}Error parsing test results: ${error.message}${colors.reset}`);
        reject(error);
      }
    });
  });
}

/**
 * Parse test output to extract results
 * @param {string} output - The test output to parse
 * @returns {Object} The parsed test results
 */
function parseTestOutput(output) {
  // Default results structure
  const results = {
    stats: {
      tests: 0,
      passes: 0,
      failures: 0,
      duration: 0
    },
    results: []
  };
  
  try {
    // Extract test suites
    const suiteMatches = output.matchAll(/(?:^|\n)\s*(.+?)(?:\n\s+✓|\n\s+\d+\))/g);
    const suites = Array.from(suiteMatches, m => m[1]).filter(s => !s.match(/passing|failing/i));
    
    // Process each suite
    suites.forEach(suiteTitle => {
      // Create suite object
      const suite = {
        title: suiteTitle.trim(),
        tests: []
      };
      
      // Extract passed tests
      const passedMatches = output.matchAll(new RegExp(`(?:^|\\n)\\s+✓\\s+(.*?)(?:\\s+\\(\\d+ms\\)|\\n)`, 'g'));
      const passedTests = Array.from(passedMatches, m => ({
        title: m[1],
        state: 'passed',
        duration: 0 // Duration not available
      }));
      
      // Extract failed tests
      const failedMatches = output.matchAll(/(?:^|\n)\s+\d+\)\s+(.*?)(?:\s+|:|\n)/g);
      const failedTests = Array.from(failedMatches, m => ({
        title: m[1],
        state: 'failed',
        duration: 0 // Duration not available
      }));
      
      // Combine tests and update suite
      suite.tests = [...passedTests, ...failedTests];
      results.results.push(suite);
      
      // Update stats
      results.stats.tests += suite.tests.length;
      results.stats.passes += passedTests.length;
      results.stats.failures += failedTests.length;
    });
    
    // Extract duration
    const durationMatch = output.match(/(\d+) passing \((\d+)ms\)/);
    if (durationMatch) {
      results.stats.duration = parseInt(durationMatch[2], 10);
    }
    
    return results;
  } catch (error) {
    console.error(`${colors.red}Error parsing test results: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Serve the HTML report
 * @param {number} port - The port to serve the report on
 */
function serveResults(port) {
  const expressApp = express();
  expressApp.use(cors());

  expressApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'report.html'));
  });

  expressApp.get('/report', (req, res) => {
    res.sendFile(REPORT_FILE);
  });

  expressApp.get('/csv', (req, res) => {
    res.sendFile(REPORT_CSV);
  });

  expressApp.listen(port, () => {
    console.log(`${colors.green}Test report server started on port ${port}${colors.reset}`);
  });
}