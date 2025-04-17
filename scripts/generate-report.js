const fs = require('fs');
const path = require('path');

/**
 * Generates a test report and saves it with a timestamp
 * @param {Object} results - Test results
 * @param {Object} systemInfo - System information
 */
function generateReport(results, systemInfo) {
    const timestamp = new Date().toISOString();
    const reportId = `test-results-${timestamp.replace(/[:.]/g, '-')}`;
    
    // Create the report directory if it doesn't exist
    const reportDir = path.join(__dirname, '../public/report');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Generate the report data
    const reportData = {
        timestamp,
        summary: {
            total: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            duration: results.reduce((sum, r) => sum + r.duration, 0)
        },
        results,
        systemInfo,
        rawOutput: ''  // Add raw output if available
    };
    
    // Save the report
    const reportPath = path.join(reportDir, `${reportId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`Report saved to ${reportPath}`);
    
    // Also save as latest report
    fs.writeFileSync(path.join(reportDir, 'test-results.json'), JSON.stringify(reportData, null, 2));
    console.log(`Latest report saved to ${path.join(reportDir, 'test-results.json')}`);
    
    // Update history
    updateHistory(reportData);
    
    return reportPath;
}

/**
 * Updates test history with new report data
 * @param {Object} reportData - Report data
 */
function updateHistory(reportData) {
    const historyPath = path.join(__dirname, '../public/report/history.json');
    let history = [];
    
    // Load existing history if available
    if (fs.existsSync(historyPath)) {
        try {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch (err) {
            console.error('Error reading history file:', err);
        }
    }
    
    // Add new report to history
    history.push({
        timestamp: reportData.timestamp,
        summary: reportData.summary
    });
    
    // Keep only the last 30 reports
    if (history.length > 30) {
        history = history.slice(history.length - 30);
    }
    
    // Save updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`History updated at ${historyPath}`);
}

module.exports = {
    generateReport
}; 