/**
 * Comprehensive test runner and reporter for the Tribes by Astrix project
 * This script:
 * 1. Runs the specified test suite (unit, integration, journey, or all)
 * 2. Captures and formats test results
 * 3. Generates a JSON report
 * 4. Optionally serves an HTML visualization of results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const glob = require('glob');

// Get command line arguments
const args = process.argv.slice(2);
const testType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
const serveResults = args.includes('--serve');
const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '3000');

// Paths
const REPORTS_DIR = path.join(process.cwd(), 'public/report');
const RESULTS_FILE = path.join(REPORTS_DIR, 'test-results.json');
const HISTORY_FILE = path.join(REPORTS_DIR, 'history.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const HTML_TEMPLATE = path.join(PUBLIC_DIR, 'index.html');
const CSV_FILE = path.join(REPORTS_DIR, 'test-results.csv');

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Constants for history storage
const MAX_HISTORY_ENTRIES = 100;

// Determine which tests to run
let testPattern;
switch (testType) {
  case 'unit':
    testPattern = 'test/unit/*.test.ts';
    break;
  case 'integration':
    testPattern = 'test/integration/*.test.ts';
    break;
  case 'journey':
    testPattern = 'test/journey/*.test.ts';
    break;
  case 'all':
  default:
    testPattern = 'test/**/*.test.ts';
    break;
}

/**
 * Generates a test report and saves it with a timestamp
 * @param {Object} results - Test results
 * @param {Object} systemInfo - System information
 * @param {string} rawOutput - Raw output from test run
 * @returns {string} - The path to the generated report
 */
function generateReport(results, systemInfo, rawOutput = '') {
  const timestamp = new Date().toISOString();
  
  // Create the report directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Calculate summary stats from the results
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  results.forEach(suite => {
    if (suite.tests && Array.isArray(suite.tests)) {
      totalTests += suite.tests.length;
      passedTests += suite.tests.filter(test => test.status === 'passed').length;
      failedTests += suite.tests.filter(test => test.status === 'failed').length;
    }
  });
  
  // Generate the report data
  const reportData = {
    timestamp,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      duration: 0
    },
    results,
    systemInfo,
    rawOutput
  };
  
  // Save the JSON report
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(reportData, null, 2));
  console.log(`Test results saved to ${RESULTS_FILE}`);
  
  // Generate CSV report
  generateCsvReport(results);
  
  return RESULTS_FILE;
}

/**
 * Generates a CSV report from test results
 * @param {Array} results - Array of test suite results
 */
function generateCsvReport(results) {
  let csvContent = 'Suite,Test,Status,Duration\n';
  
  results.forEach(suite => {
    if (suite.tests && Array.isArray(suite.tests)) {
      suite.tests.forEach(test => {
        csvContent += `"${suite.name}","${test.name}","${test.status}","${test.duration || 0}"\n`;
      });
    }
  });
  
  fs.writeFileSync(CSV_FILE, csvContent);
  console.log(`CSV report saved to ${CSV_FILE}`);
}

// Function to run tests and parse results
function runTests() {
  const testFiles = glob.sync(testPattern);
  console.log(`Found ${testFiles.length} test files matching pattern: ${testPattern}`);

  const systemInfo = getSystemInfo();
  const testResults = [];
  
  // Run the tests and capture output
  console.log(`\n🚀 Running ${testType} tests...\n`);
  let output;
  try {
    output = execSync(`npx hardhat test ${testPattern}`, { encoding: 'utf8' });
    console.log("Tests completed successfully.");
  } catch (error) {
    console.error("Some tests failed.");
    output = error.stdout || '';
  }

  // Parse output to extract test suites and test cases
  const suites = parseTestOutput(output);
  
  // Add the parsed suites to results
  testResults.push(...suites);
  
  // Generate summary stats
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  testResults.forEach(suite => {
    if (suite.tests && Array.isArray(suite.tests)) {
      totalTests += suite.tests.length;
      passedTests += suite.tests.filter(test => test.status === 'passed').length;
      failedTests += suite.tests.filter(test => test.status === 'failed').length;
    }
  });
  
  // Display failing tests if any
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.forEach(suite => {
      const failedTestsInSuite = suite.tests.filter(test => test.status === 'failed');
      if (failedTestsInSuite.length > 0) {
        console.log(`\nIn suite: ${suite.name}`);
        failedTestsInSuite.forEach((test, index) => {
          console.log(`  ${index + 1}. ${test.name}`);
          if (test.error) {
            console.log(`     Error: ${test.error}`);
          }
        });
      }
    });
  }
  
  // Generate report and update history
  generateReport(testResults, systemInfo, output);
  updateTestHistory({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      duration: 0
    }
  });
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      duration: 0
    },
    results: testResults
  };
}

/**
 * Parse the test output to extract test suites and test cases
 * @param {string} output - Raw output from test run
 * @returns {Array} - Array of test suite objects
 */
function parseTestOutput(output) {
  const suites = [];
  const lines = output.split('\n');
  
  let currentSuite = null;
  let currentTest = null;
  
  // Regex patterns for test output parsing
  const suiteStartRegex = /^\s*(describe|context)\s*\(\s*(?:'|")(.+?)(?:'|")/;
  const testRegex = /^\s*(?:✓|✗|✘)\s+(?:\[\d+\w+\])?\s*(.+?)(?:\s+\(\d+\w+\))?$/;
  const testStartRegex = /^\s*it\s*\(\s*(?:'|")(.+?)(?:'|")/;
  const errorStartRegex = /^\s*Error:/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match suite start
    const suiteMatch = line.match(suiteStartRegex);
    if (suiteMatch) {
      if (currentSuite && currentSuite.tests.length > 0) {
        suites.push(currentSuite);
      }
      
      currentSuite = {
        name: suiteMatch[2],
        tests: []
      };
      continue;
    }
    
    // Match test result
    const testMatch = line.match(testRegex);
    if (testMatch && currentSuite) {
      const testName = testMatch[1].trim();
      const isPassed = line.includes('✓');
      
      currentTest = {
        name: testName,
        status: isPassed ? 'passed' : 'failed',
        duration: 0,
        error: ''
      };
      
      currentSuite.tests.push(currentTest);
      continue;
    }
    
    // Match test start without result (for better name extraction)
    const testStartMatch = line.match(testStartRegex);
    if (testStartMatch) {
      currentTest = {
        name: testStartMatch[1].trim(),
        // Don't set status yet, wait for result
      };
      continue;
    }
    
    // Capture error messages
    if (errorStartRegex.test(line) && currentTest && currentTest.status === 'failed') {
      currentTest.error = line;
      
      // Capture stack trace
      let j = i + 1;
      while (j < lines.length && lines[j].trim() && !lines[j].trim().startsWith('✓') && !lines[j].trim().startsWith('✗')) {
        currentTest.error += '\n' + lines[j].trim();
        j++;
      }
      
      i = j - 1; // Skip processed lines
    }
  }
  
  // Add the last suite if it exists
  if (currentSuite && currentSuite.tests.length > 0) {
    suites.push(currentSuite);
  }
  
  // If no suites were found, create a default one
  if (suites.length === 0) {
    const defaultSuite = {
      name: "All Tests",
      tests: []
    };
    
    // Extract passed and failed tests from output
    const passedTests = (output.match(/✓/g) || []).length;
    const failedTests = (output.match(/✗|✘/g) || []).length;
    
    // Search for NFT Controller tests (which we know are failing)
    const nftControllerTests = [];
    let inNftSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('NFT Controller') || line.includes('CollectibleController')) {
        inNftSection = true;
      } else if (inNftSection && line.match(/^\s*(?:✓|✗|✘)\s+(.+)$/)) {
        const match = line.match(/^\s*(?:✓|✗|✘)\s+(.+)$/);
        if (match) {
          const status = line.includes('✓') ? 'passed' : 'failed';
          nftControllerTests.push({
            name: match[1].trim(),
            status: status,
            duration: 0
          });
        }
      } else if (line.match(/^\s*\d+\s+passing/) && inNftSection) {
        inNftSection = false;
      }
    }
    
    // If we found specific NFT tests, add them
    if (nftControllerTests.length > 0) {
      defaultSuite.tests = nftControllerTests;
    } else {
      // Otherwise fall back to generic counting
      for (let i = 0; i < passedTests; i++) {
        defaultSuite.tests.push({
          name: `Test ${i + 1}`,
          status: 'passed',
          duration: 0
        });
      }
      
      for (let i = 0; i < failedTests; i++) {
        defaultSuite.tests.push({
          name: `Test ${passedTests + i + 1}`,
          status: 'failed',
          duration: 0
        });
      }
    }
    
    suites.push(defaultSuite);
  }
  
  return suites;
}

// Function to load test history
function loadTestHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading test history:', error);
  }
  return [];
}

// Function to save test history
function saveTestHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving test history:', error);
  }
}

// Function to update test history with new results
function updateTestHistory(testResults) {
  const history = loadTestHistory();
  history.unshift({
    timestamp: testResults.timestamp,
    type: testType,
    summary: testResults.summary
  });

  // Keep only last MAX_HISTORY_ENTRIES entries
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }

  saveTestHistory(history);
  console.log('📊 Test history updated');
}

// Function to start HTTP server for viewing results
function startServer() {
  if (!fs.existsSync(HTML_TEMPLATE)) {
    console.error(`❌ HTML template not found at: ${HTML_TEMPLATE}`);
    process.exit(1);
  }

  const app = express();
  app.use(cors());
  app.use(express.static(PUBLIC_DIR));
  
  // API endpoint for all reports
  app.get('/api/reports', (req, res) => {
    try {
      if (!fs.existsSync(REPORTS_DIR)) {
        return res.json([]);
      }

      const files = fs.readdirSync(REPORTS_DIR)
        .filter(file => file.endsWith('.json') && !file.endsWith('history.json'));

      const reports = files.map(file => {
        const filePath = path.join(REPORTS_DIR, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return {
            id: file.replace('.json', ''),
            timestamp: data.timestamp || new Date().toISOString(),
            summary: data.summary || { total: 0, passed: 0, failed: 0, duration: 0 }
          };
        } catch (err) {
          console.error(`Error parsing ${file}:`, err);
          return null;
        }
      }).filter(Boolean);

      res.json(reports);
    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  });

  // API endpoint for test results
  app.get('/api/results', (req, res) => {
    try {
      const { reportId } = req.query;
      let filePath;

      if (reportId === 'latest' || !reportId) {
        filePath = RESULTS_FILE;
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'No reports found' });
        }
      } else {
        // Get the specific report file
        filePath = path.join(REPORTS_DIR, `${reportId}.json`);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Report not found' });
        }
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load test results' });
    }
  });

  // API endpoint for test history
  app.get('/api/history', (req, res) => {
    try {
      const history = loadTestHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load test history' });
    }
  });

  app.listen(port, () => {
    console.log(`\n🌐 Server running at http://localhost:${port}`);
    console.log(`📋 View test report at http://localhost:${port}/index.html`);
    
    // Open browser automatically
    const url = `http://localhost:${port}/index.html`;
    let command;
    
    switch (process.platform) {
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${url}"`;
        break;
      default: // Linux and others
        command = `xdg-open "${url}"`;
        break;
    }
    
    try {
      execSync(command);
    } catch (error) {
      console.log(`Note: Could not open browser automatically. Please navigate to ${url} manually.`);
    }
  });
}

// Main execution
function main() {
  // Step 1: Run tests
  const testResults = runTests();
  
  // Print test summary
  console.log('\n📝 Test Summary:');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⏱️ Duration: ${(testResults.summary.duration / 1000).toFixed(2)}s`);
  
  // Step 2: Serve results if requested
  if (serveResults) {
    startServer();
  }
}

// Run the main function
main();

// Function to collect system information
function getSystemInfo() {
  try {
    const os = require('os');
    
    // Memory info
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cpuCount = cpus.length;
    
    // Disk info (simplified)
    const diskInfo = [];
    try {
      const df = execSync('df -h /').toString().split('\n');
      if (df.length >= 2) {
        diskInfo.push(df[0]);
        diskInfo.push(df[1]);
      }
    } catch (err) {
      diskInfo.push('Disk info not available');
    }
    
    return {
      memory: {
        total: formatBytes(totalMemory),
        used: formatBytes(usedMemory),
        free: formatBytes(freeMemory),
        percentUsed: Math.round((usedMemory / totalMemory) * 100) + '%'
      },
      cpu: `${cpuModel} (${cpuCount} cores)`,
      disk: diskInfo,
      os: `${os.type()} ${os.release()} ${os.arch()}`
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      memory: { total: 'N/A', used: 'N/A', free: 'N/A', percentUsed: 'N/A' },
      cpu: 'N/A',
      disk: ['N/A'],
      os: 'N/A'
    };
  }
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 