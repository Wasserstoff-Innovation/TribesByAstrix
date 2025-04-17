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
const { generateReport } = require('./generate-report');

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

// Function to run tests and parse results
function runTests(pattern) {
  console.log(`\n🚀 Running ${testType} tests...\n`);
  
  try {
    // Run tests using Hardhat
    const output = execSync(`npx hardhat test ${pattern} --network hardhat`, { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Parse test results
    const lines = output.split('\n');
    const testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      },
      results: [],
      rawOutput: output
    };

    let currentSuite = null;
    let currentTests = [];
    let currentTest = null;
    let errorBuffer = [];
    let isCollectingError = false;

    lines.forEach(line => {
      // Test suite parsing
      if (line.includes('describe(') || line.includes('describe.only(') || line.includes('describe.skip(')) {
        if (currentSuite && currentTests.length > 0) {
          testResults.results.push({
            name: currentSuite,
            description: currentSuite,
            tests: currentTests
          });
        }
        const match = line.match(/describe(?:\.only|\.skip)?\("([^"]+)"/) || 
                      line.match(/describe(?:\.only|\.skip)?\('([^']+)'/);
        currentSuite = match?.[1] || "Unknown Suite";
        currentTests = [];
        isCollectingError = false;
      } 
      // Test case parsing
      else if (line.includes('✓') || line.includes('✗') || line.includes('✘')) {
        const status = line.includes('✓') ? 'passed' : 'failed';
        let name = line.replace(/[✓✗✘]\s*/, '').trim();
        const durationMatch = name.match(/\((\d+)ms\)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
        
        if (durationMatch) {
          name = name.replace(/\(\d+ms\)/, '').trim();
        }
        
        // If we were collecting an error, save it to the previous test
        if (isCollectingError && currentTest) {
          currentTest.error = errorBuffer.join('\n');
        }

        currentTest = {
          name,
          description: name,
          status,
          duration,
          error: null,
          output: line.trim()
        };

        currentTests.push(currentTest);
        testResults.summary[status]++;
        testResults.summary.total++;
        testResults.summary.duration += currentTest.duration;

        errorBuffer = [];
        isCollectingError = status === 'failed';
      }
      // Error message collection
      else if (isCollectingError && currentTest) {
        if (line.trim() && !line.includes('✓') && !line.includes('✗')) {
          errorBuffer.push(line.trim());
        }
      }
      // Additional test information
      else if (line.trim() && currentTest && !line.includes('describe(')) {
        currentTest.output += '\n' + line.trim();
      }
    });

    // Add the last suite if there is one
    if (currentSuite && currentTests.length > 0) {
      testResults.results.push({
        name: currentSuite,
        description: currentSuite,
        tests: currentTests
      });
    }

    // Get system information
    const systemInfo = getSystemInfo();
    
    // Use our report generator to create a timestamped report
    const reportPath = generateReport(testResults.results, systemInfo);
    console.log('\n✅ Test execution completed and results saved');
    
    // Update test history
    updateTestHistory(testResults);
    
    return testResults;
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
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
        // Get the most recent report file
        const files = fs.readdirSync(REPORTS_DIR)
          .filter(file => file.endsWith('.json') && !file.endsWith('history.json'))
          .map(file => ({
            name: file,
            time: fs.statSync(path.join(REPORTS_DIR, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);

        if (files.length === 0) {
          return res.status(404).json({ error: 'No reports found' });
        }

        filePath = path.join(REPORTS_DIR, files[0].name);
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
  const testResults = runTests(testPattern);
  
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