import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
    id: number;
    suiteName: string;
    testName: string;
    description: string;
    status: 'passed' | 'failed';
    duration: number;
    error?: {
        message: string;
        stack?: string;
        actual?: any;
        expected?: any;
        operator?: string;
    };
    output: string[];
    timestamp: string;
}

interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    startTime: string;
    endTime: string;
}

interface SystemInfo {
    memory: Record<string, string>;
    cpu: string;
    disk: string[];
}

interface TestReport {
    timestamp: string;
    summary: TestSummary;
    results: TestResult[];
    systemInfo: SystemInfo;
    suites: {
        name: string;
        totalTests: number;
        passedTests: number;
        failedTests: number;
        duration: number;
    }[];
}

class TestLogger {
    private static instance: TestLogger;
    private report: TestReport;
    private currentSuite: string | null = null;
    private suiteStartTime: number = 0;
    private testStartTime: number = 0;
    private testCounter: number = 0;
    private suiteSummaries: Map<string, {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        duration: number;
    }> = new Map();

    private constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString()
            },
            results: [],
            systemInfo: {
                memory: {},
                cpu: '',
                disk: []
            },
            suites: []
        };
    }

    static getInstance(): TestLogger {
        if (!TestLogger.instance) {
            TestLogger.instance = new TestLogger();
        }
        return TestLogger.instance;
    }

    startSuite(name: string, description?: string) {
        if (this.currentSuite) {
            this.endSuite();
        }

        this.currentSuite = name;
        this.suiteStartTime = Date.now();
        this.suiteSummaries.set(name, {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            duration: 0
        });
    }

    endSuite() {
        if (this.currentSuite) {
            const suiteSummary = this.suiteSummaries.get(this.currentSuite);
            if (suiteSummary) {
                suiteSummary.duration = Date.now() - this.suiteStartTime;
                this.report.suites.push({
                    name: this.currentSuite,
                    ...suiteSummary
                });
            }
            this.currentSuite = null;
        }
    }

    startTest(name: string) {
        this.testStartTime = Date.now();
    }

    endTest(name: string, status: 'passed' | 'failed', error?: string, output: string[] = []) {
        if (!this.currentSuite) {
            throw new Error('No active test suite');
        }

        const duration = Date.now() - this.testStartTime;
        let parsedError;
        
        if (error) {
            try {
                parsedError = JSON.parse(error);
            } catch {
                parsedError = { message: error };
            }
        }

        const testResult: TestResult = {
            id: ++this.testCounter,
            suiteName: this.currentSuite,
            testName: name,
            description: name, // Can be enhanced with actual test description
            status,
            duration,
            output,
            timestamp: new Date().toISOString(),
            ...(parsedError && { error: parsedError })
        };

        this.report.results.push(testResult);
        this.report.summary.total++;
        this.report.summary[status]++;
        this.report.summary.duration += duration;

        // Update suite summary
        const suiteSummary = this.suiteSummaries.get(this.currentSuite);
        if (suiteSummary) {
            suiteSummary.totalTests++;
            suiteSummary[`${status}Tests`]++;
            suiteSummary.duration += duration;
        }
    }

    setSystemInfo(info: SystemInfo) {
        this.report.systemInfo = info;
    }

    saveReport() {
        try {
            if (this.currentSuite) {
                this.endSuite();
            }

            this.report.summary.endTime = new Date().toISOString();

            // Sort results by suite name and test name for better readability
            this.report.results.sort((a, b) => {
                if (a.suiteName === b.suiteName) {
                    return a.testName.localeCompare(b.testName);
                }
                return a.suiteName.localeCompare(b.suiteName);
            });

            // Sort suites by name
            this.report.suites.sort((a, b) => a.name.localeCompare(b.name));

            // Ensure report directory exists
            const reportDir = join(process.cwd(), 'public', 'report');
            if (!existsSync(reportDir)) {
                console.log(`Creating report directory: ${reportDir}`);
                mkdirSync(reportDir, { recursive: true });
            }

            // Save JSON report
            const reportPath = join(reportDir, 'test-results.json');
            console.log(`Saving JSON report to: ${reportPath}`);
            writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
            console.log('JSON report saved successfully');

            // Save CSV report
            const csvPath = join(reportDir, 'test-results.csv');
            console.log(`Saving CSV report to: ${csvPath}`);
            const csvContent = this.generateCSV();
            writeFileSync(csvPath, csvContent);
            console.log('CSV report saved successfully');

            // Log summary
            console.log('\nTest Report Summary:');
            console.log(`Total Tests: ${this.report.summary.total}`);
            console.log(`Passed: ${this.report.summary.passed}`);
            console.log(`Failed: ${this.report.summary.failed}`);
            console.log(`Duration: ${this.report.summary.duration}ms`);
            console.log(`Reports saved in: ${reportDir}`);

        } catch (error) {
            console.error('Error saving test reports:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
            }
            throw error; // Re-throw to ensure the error is not silently caught
        }
    }

    private generateCSV(): string {
        const headers = [
            'ID',
            'Suite',
            'Test Name',
            'Description',
            'Status',
            'Duration (ms)',
            'Error',
            'Timestamp'
        ];

        const rows = this.report.results.map(result => [
            result.id,
            result.suiteName,
            result.testName,
            result.description,
            result.status,
            result.duration,
            result.error ? result.error.message : '',
            result.timestamp
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.map(cell => 
                typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
            ).join(','))
        ].join('\n');
    }
}

export const logger = TestLogger.getInstance(); 