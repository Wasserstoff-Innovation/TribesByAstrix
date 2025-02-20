#!/bin/bash

# Create report directory if it doesn't exist
mkdir -p test/report

# Function to format test output as JSON
format_test_output() {
    # Run tests and capture output
    npx hardhat test test/unit/*.test.ts | node -e '
        const fs = require("fs");
        let data = "";
        process.stdin.on("data", chunk => data += chunk);
        process.stdin.on("end", () => {
            const lines = data.toString().split("\n");
            const testResults = {
                timestamp: new Date().toISOString(),
                summary: {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    duration: 0
                },
                results: [],
                systemInfo: {
                    memory: {},
                    cpu: "",
                    disk: []
                },
                rawOutput: lines.join("\n") // Store complete raw output
            };

            let currentSuite = null;
            let currentTests = [];
            let currentTest = null;
            let isSystemInfo = false;
            let isMemoryInfo = false;
            let isCPUInfo = false;
            let isDiskInfo = false;
            let errorBuffer = [];
            let isCollectingError = false;

            lines.forEach((line, index) => {
                // System info parsing
                if (line.includes("System resources:")) {
                    isSystemInfo = true;
                } else if (isSystemInfo) {
                    if (line.includes("Memory usage:")) {
                        isMemoryInfo = true;
                    } else if (line.includes("CPU usage:")) {
                        isMemoryInfo = false;
                        isCPUInfo = true;
                    } else if (line.includes("Disk usage:")) {
                        isCPUInfo = false;
                        isDiskInfo = true;
                    } else if (isMemoryInfo && line.trim()) {
                        const [key, value] = line.split(":");
                        if (key && value) {
                            testResults.systemInfo.memory[key.trim()] = value.trim();
                        }
                    } else if (isCPUInfo && line.trim()) {
                        testResults.systemInfo.cpu = line.trim();
                    } else if (isDiskInfo && line.trim() && !line.includes("Filesystem")) {
                        testResults.systemInfo.disk.push(line.trim());
                    }
                }

                // Test suite parsing
                if (line.includes("describe(")) {
                    if (currentSuite) {
                        testResults.results.push({
                            name: currentSuite,
                            description: currentSuite,
                            tests: currentTests
                        });
                    }
                    currentSuite = line.match(/describe\("([^"]+)"/)?.[1] || "Unknown Suite";
                    currentTests = [];
                    isCollectingError = false;
                } 
                // Test case parsing
                else if (line.includes("✓") || line.includes("✗")) {
                    const status = line.includes("✓") ? "passed" : "failed";
                    const name = line.replace(/[✓✗]\s*/, "").trim();
                    const duration = line.match(/\((\d+)ms\)/)?.[1] || "0";
                    
                    // If we were collecting an error, save it to the previous test
                    if (isCollectingError && currentTest) {
                        currentTest.error = errorBuffer.join("\n");
                    }

                    currentTest = {
                        name,
                        description: name,
                        status,
                        duration: parseInt(duration),
                        error: null,
                        output: line.trim()
                    };

                    currentTests.push(currentTest);
                    testResults.summary[status]++;
                    testResults.summary.total++;
                    testResults.summary.duration += currentTest.duration;

                    errorBuffer = [];
                    isCollectingError = status === "failed";
                }
                // Error message collection
                else if (isCollectingError && currentTest) {
                    if (line.trim() && !line.includes("✓") && !line.includes("✗")) {
                        errorBuffer.push(line.trim());
                    }
                }
                // Additional test information
                else if (line.trim() && currentTest && !line.includes("describe(")) {
                    currentTest.output += "\n" + line.trim();
                }
            });

            // Add last suite
            if (currentSuite) {
                testResults.results.push({
                    name: currentSuite,
                    description: currentSuite,
                    tests: currentTests
                });
            }

            // Write results to file
            fs.writeFileSync("test/report/test-results.json", JSON.stringify(testResults, null, 2));
        });
    '
}

# Run tests and format output
format_test_output

# Generate HTML report
node public/generate-report.js

# Open the report in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" ]]; then
    start http://localhost:3000
fi 