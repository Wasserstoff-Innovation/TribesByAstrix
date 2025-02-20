const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Constants for file paths
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const REPORTS_DIR = path.join(process.cwd(), 'public/report');
const HISTORY_FILE = path.join(REPORTS_DIR, 'test-history.json');
const RESULTS_FILE = path.join(REPORTS_DIR, 'test-results.json');
const HTML_FILE = path.join(PUBLIC_DIR, 'index.html');

// Constants for history storage
const MAX_HISTORY_ENTRIES = 100;

// Ensure directories exist
[PUBLIC_DIR, REPORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

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
        summary: testResults.summary,
        systemInfo: testResults.systemInfo
    });

    // Keep only last MAX_HISTORY_ENTRIES entries
    if (history.length > MAX_HISTORY_ENTRIES) {
        history.length = MAX_HISTORY_ENTRIES;
    }

    saveTestHistory(history);
}

// Function to start HTTP server
function startServer(port = 3000) {
    const app = express();
    app.use(cors());
    app.use(express.static(PUBLIC_DIR));
    
    // API endpoint for test results
    app.get('/api/results', (req, res) => {
        try {
            const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
            res.json(results);
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
        console.log(`Server running at http://localhost:${port}`);
        console.log(`View test report at http://localhost:${port}/index.html`);
    });
}

// Main execution
async function main() {
    try {
        console.log('Reading test results...');
        const testResults = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

        // Update test history
        console.log('Updating test history...');
        updateTestHistory(testResults);

        // Copy HTML file to public directory
        console.log('Copying HTML file...');
        try {
            fs.copyFileSync(path.join(__dirname, 'index.html'), HTML_FILE);
            console.log('HTML file copied successfully');
        } catch (error) {
            console.error('Error copying HTML file:', error);
            process.exit(1);
        }

        console.log('Test report generated successfully!');
        console.log('\nTest Summary:');
        console.log(`Total Tests: ${testResults.summary.total}`);
        console.log(`✓ Passed: ${testResults.summary.passed}`);
        console.log(`✗ Failed: ${testResults.summary.failed}`);
        console.log(`Duration: ${(testResults.summary.duration / 1000).toFixed(1)}s`);

        // Start HTTP server
        startServer();
    } catch (error) {
        console.error('Error generating report:', error);
        process.exit(1);
    }
}

main().catch(console.error); 