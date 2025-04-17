const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '.')));

// Directory containing report files
const REPORTS_DIR = path.join(__dirname, 'report');

// API endpoint to get the list of available reports
app.get('/api/reports', (req, res) => {
    try {
        // Ensure the reports directory exists
        if (!fs.existsSync(REPORTS_DIR)) {
            return res.json([]);
        }

        // Get all JSON files in the reports directory
        const files = fs.readdirSync(REPORTS_DIR)
            .filter(file => file.endsWith('.json') && !file.endsWith('history.json'));

        // Extract report information from each file
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

// API endpoint to get a specific test result or the latest
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
        console.error('Error getting test results:', error);
        res.status(500).json({ error: 'Failed to get test results' });
    }
});

// API endpoint to get test history
app.get('/api/history', (req, res) => {
    try {
        const historyFilePath = path.join(REPORTS_DIR, 'history.json');
        
        if (!fs.existsSync(historyFilePath)) {
            // If no history file exists, create one from available reports
            const reports = fs.readdirSync(REPORTS_DIR)
                .filter(file => file.endsWith('.json') && !file.endsWith('history.json'))
                .map(file => {
                    const filePath = path.join(REPORTS_DIR, file);
                    try {
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        return {
                            timestamp: data.timestamp || new Date().toISOString(),
                            summary: data.summary || { total: 0, passed: 0, failed: 0, duration: 0 }
                        };
                    } catch (err) {
                        return null;
                    }
                })
                .filter(Boolean)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return res.json(reports);
        }

        const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
        res.json(history);
    } catch (error) {
        console.error('Error getting test history:', error);
        res.status(500).json({ error: 'Failed to get test history' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Test Report Server running at http://localhost:${port}`);
}); 