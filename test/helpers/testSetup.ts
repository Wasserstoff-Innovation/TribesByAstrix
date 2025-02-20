import { logger } from '../utils/TestLogger';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Define test error interface
interface TestError extends Error {
    actual?: any;
    expected?: any;
    operator?: string;
}

// Define test interface
interface Test {
    title?: string;
    fullTitle(): string;
    parent?: {
        title?: string;
        suites?: Array<{ title: string }>;
    };
    state?: string;
    duration?: number;
    err?: TestError;
    context?: any;
}

// Store test outputs
const testOutputs = new Map<string, string[]>();

// Capture console output
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

function captureOutput(type: string, ...args: any[]) {
    const testTitle = (global as any).currentTest?.title;
    if (testTitle) {
        const output = testOutputs.get(testTitle) || [];
        output.push(`[${type}] ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ')}`);
        testOutputs.set(testTitle, output);
    }
    return type === 'error' ? originalError(...args) :
           type === 'warn' ? originalWarn(...args) :
           type === 'info' ? originalInfo(...args) :
           originalLog(...args);
}

before(async function() {
    // Create necessary directories
    const reportDir = join(process.cwd(), 'public', 'report');
    if (!existsSync(reportDir)) {
        console.log(`Creating report directory: ${reportDir}`);
        mkdirSync(reportDir, { recursive: true });
    }

    // Set up console capture
    console.log = (...args) => captureOutput('log', ...args);
    console.error = (...args) => captureOutput('error', ...args);
    console.warn = (...args) => captureOutput('warn', ...args);
    console.info = (...args) => captureOutput('info', ...args);

    try {
        // Get system info
        const systemInfo: {
            memory: Record<string, string>;
            cpu: string;
            disk: string[];
        } = {
            memory: {},
            cpu: '',
            disk: []
        };

        // Get memory info
        console.log('Collecting system information...');
        const memOutput = execSync('vm_stat').toString();
        memOutput.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                systemInfo.memory[key] = value;
            }
        });

        // Get CPU info
        systemInfo.cpu = execSync('top -l 1 | grep -E "^CPU"').toString().trim();

        // Get disk info
        systemInfo.disk = execSync('df -h .').toString().split('\n').filter(Boolean);

        console.log('Setting system information in logger...');
        logger.setSystemInfo(systemInfo);
    } catch (error) {
        console.error('Error getting system info:', error);
    }
});

after(function() {
    // Restore console functions
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;

    try {
        console.log('Saving test report...');
        logger.saveReport();
        console.log('Test report saved successfully');
    } catch (error) {
        console.error('Error saving test report:', error);
        throw error;
    }
});

beforeEach(function() {
    try {
        // Store current test reference
        const currentTest = this.currentTest as Test;
        (global as any).currentTest = currentTest;

        const suiteName = currentTest?.parent?.title || 'Unknown Suite';
        const testName = currentTest?.title || 'Unknown Test';
        const fullTitle = currentTest?.fullTitle() || '';
        const description = currentTest?.parent?.suites?.[0]?.title || '';
        
        // Clear previous test outputs
        testOutputs.clear();
        
        console.log(`Starting test: ${suiteName} - ${testName}`);
        logger.startSuite(suiteName, description);
        logger.startTest(testName);
    } catch (error) {
        console.error('Error in beforeEach:', error);
        throw error;
    }
});

afterEach(function() {
    try {
        const currentTest = this.currentTest as Test;
        const testName = currentTest?.title || 'Unknown Test';
        const status = currentTest?.state === 'passed' ? 'passed' : 'failed';
        const error = currentTest?.err ? {
            message: currentTest.err.message,
            stack: currentTest.err.stack,
            actual: currentTest.err.actual,
            expected: currentTest.err.expected,
            operator: currentTest.err.operator
        } : undefined;

        // Get captured output
        const output = testOutputs.get(testName) || [];
        
        // Add test context if available
        if (currentTest?.context) {
            output.push(`Context: ${JSON.stringify(currentTest.context, null, 2)}`);
        }

        // Add test duration
        const duration = currentTest?.duration || 0;
        output.push(`Duration: ${duration}ms`);

        console.log(`Ending test: ${testName} (${status})`);
        logger.endTest(
            testName,
            status,
            error ? JSON.stringify(error, null, 2) : undefined,
            output
        );

        // Clear current test reference
        (global as any).currentTest = undefined;
    } catch (error) {
        console.error('Error in afterEach:', error);
        throw error;
    }
}); 