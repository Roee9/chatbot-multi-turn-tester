import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConcurrencyPool } from './pool';
import { ChatAdapter } from '../adapters/adapter';
import { Finding, ScanResult, ScanStatus, TranscriptMessage } from './types';

// Extended types for orchestrator
export interface ScanConfig {
  url: string;
  suite: string;
  maxConcurrency?: number;
  testTimeout?: number; // per test timeout in ms
  turnTimeout?: number; // per turn timeout in ms
}

export interface TestRun {
  id: string;
  testId: string;
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: Finding[];
  transcript: TranscriptMessage[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface ScanRun {
  id: string;
  config: ScanConfig;
  status: ScanStatus;
  startTime: Date;
  endTime?: Date;
  testRuns: TestRun[];
  summary: {
    totalTests: number;
    completedTests: number;
    failedTests: number;
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
}

// In-memory stores
const runs = new Map<string, ScanRun>();
const statuses = new Map<string, ScanStatus>();
const results = new Map<string, ScanResult>();

/**
 * Main orchestrator for managing scan execution
 */
export class ScanOrchestrator {
  private pool: ConcurrencyPool;
  private adapter: ChatAdapter;
  private suites: Map<string, any> = new Map();

  constructor(adapter: ChatAdapter, maxConcurrency: number = 5) {
    this.pool = new ConcurrencyPool(maxConcurrency);
    this.adapter = adapter;
  }

  /**
   * Register a test suite
   */
  registerSuite(name: string, tests: any[]): void {
    this.suites.set(name, tests);
  }

  /**
   * Start a new scan
   */
  async startScan(config: ScanConfig): Promise<string> {
    const scanId = uuidv4();
    const suite = this.suites.get(config.suite);
    
    if (!suite) {
      throw new Error(`Suite '${config.suite}' not found`);
    }

    // Create a new pool with the specified concurrency if provided
    const pool = config.maxConcurrency ? 
      new ConcurrencyPool(config.maxConcurrency) : 
      this.pool;

    const scanRun: ScanRun = {
      id: scanId,
      config,
      status: 'pending',
      startTime: new Date(),
      testRuns: suite.map((test: any) => ({
        id: uuidv4(),
        testId: test.id,
        scanId,
        status: 'pending',
        findings: [],
        transcript: [],
        startTime: new Date(),
      })),
      summary: {
        totalTests: suite.length,
        completedTests: 0,
        failedTests: 0,
        totalFindings: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
      }
    };

    runs.set(scanId, scanRun);
    statuses.set(scanId, 'pending');

    // Start the scan asynchronously
    this.executeScan(scanId, pool).catch(error => {
      console.error(`Scan ${scanId} failed:`, error);
      statuses.set(scanId, 'failed');
    });

    return scanId;
  }

  /**
   * Execute a scan with all its tests
   */
  private async executeScan(scanId: string, pool?: ConcurrencyPool): Promise<void> {
    const scanRun = runs.get(scanId);
    if (!scanRun) {
      throw new Error(`Scan ${scanId} not found`);
    }

    statuses.set(scanId, 'running');
    scanRun.status = 'running';

    const suite = this.suites.get(scanRun.config.suite);
    const testTimeout = scanRun.config.testTimeout || 30000; // 30s default
    const turnTimeout = scanRun.config.turnTimeout || 10000; // 10s default
    const scanPool = pool || this.pool;

    // Execute all tests concurrently using the pool
    const testPromises = scanRun.testRuns.map(testRun => 
      scanPool.run(() => this.executeTest(testRun, suite, turnTimeout))
    );

    // Wait for all tests with overall timeout
    try {
      await Promise.race([
        Promise.all(testPromises),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Scan timeout')), testTimeout);
        })
      ]);
    } catch (error) {
      console.error(`Scan ${scanId} timed out or failed:`, error);
      statuses.set(scanId, 'failed');
      scanRun.status = 'failed';
      scanRun.endTime = new Date();
      return;
    }

    // Set completion time
    scanRun.endTime = new Date();
    scanRun.status = 'completed';
    statuses.set(scanId, 'completed');
    
    // Compute final summary
    this.computeSummary(scanRun);
    
    // Generate final result
    const result = this.generateResult(scanRun);
    results.set(scanId, result);

    // Write results to file
    await this.writeResults(scanId, result);
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    testRun: TestRun, 
    suite: any[], 
    turnTimeout: number
  ): Promise<void> {
    const test = suite.find((t: any) => t.id === testRun.testId);
    if (!test) {
      testRun.status = 'failed';
      testRun.error = `Test ${testRun.testId} not found`;
      return;
    }

    testRun.status = 'running';

    try {
      const transcript: TranscriptMessage[] = [];
      
      // Execute each step in the test
      for (const step of test.steps) {
        // Add user message to transcript
        const userMessage: TranscriptMessage = {
          role: 'user',
          content: step,
          timestamp: new Date()
        };
        transcript.push(userMessage);

        // Send to adapter with timeout
        const response = await Promise.race([
          this.adapter.sendTurn(transcript.map(msg => ({
            role: msg.role,
            content: msg.content
          }))),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Turn timeout')), turnTimeout)
          )
        ]);

        // Add assistant response to transcript
        const assistantMessage: TranscriptMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        transcript.push(assistantMessage);

        // Check if this response matches any finding
        if (test.finding.matchers(response)) {
          const finding: Finding = {
            id: uuidv4(),
            type: 'test_finding',
            severity: test.finding.severity,
            description: test.finding.description,
            location: `Test: ${test.name}, Step: ${test.steps.indexOf(step) + 1}`,
            suggestion: 'Review the AI response for potential security concerns',
            timestamp: new Date()
          };
          testRun.findings.push(finding);
        }
      }

      testRun.transcript = transcript;
      testRun.status = 'completed';
      testRun.endTime = new Date();

    } catch (error) {
      testRun.status = 'failed';
      testRun.error = error instanceof Error ? error.message : 'Unknown error';
      testRun.endTime = new Date();
    }
  }

  /**
   * Compute summary statistics for a scan
   */
  private computeSummary(scanRun: ScanRun): void {
    const summary = {
      totalTests: scanRun.testRuns.length,
      completedTests: 0,
      failedTests: 0,
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
    };

    for (const testRun of scanRun.testRuns) {
      if (testRun.status === 'completed') {
        summary.completedTests++;
      } else if (testRun.status === 'failed') {
        summary.failedTests++;
      }

      for (const finding of testRun.findings) {
        summary.totalFindings++;
        switch (finding.severity) {
          case 'critical':
            summary.criticalFindings++;
            break;
          case 'high':
            summary.highFindings++;
            break;
          case 'medium':
            summary.mediumFindings++;
            break;
          case 'low':
            summary.lowFindings++;
            break;
        }
      }
    }

    scanRun.summary = summary;
  }

  /**
   * Generate final scan result
   */
  private generateResult(scanRun: ScanRun): ScanResult {
    const allFindings: Finding[] = [];
    let turnsAnalyzed = 0;

    for (const testRun of scanRun.testRuns) {
      allFindings.push(...testRun.findings);
      turnsAnalyzed += testRun.transcript.length;
    }

    return {
      id: scanRun.id,
      scanId: scanRun.id,
      status: scanRun.status,
      findings: allFindings,
      summary: scanRun.summary,
      metadata: {
        startTime: scanRun.startTime,
        endTime: scanRun.endTime,
        duration: scanRun.endTime ? 
          scanRun.endTime.getTime() - scanRun.startTime.getTime() : undefined,
        turnsAnalyzed
      },
      createdAt: scanRun.startTime,
      updatedAt: new Date()
    };
  }

  /**
   * Write results to JSON file
   */
  private async writeResults(scanId: string, result: ScanResult): Promise<void> {
    try {
      const samplesDir = path.join(process.cwd(), 'samples');
      
      // Create samples directory if it doesn't exist
      try {
        await fs.access(samplesDir);
      } catch {
        await fs.mkdir(samplesDir, { recursive: true });
      }

      const filePath = path.join(samplesDir, `${scanId}.json`);
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Failed to write results for scan ${scanId}:`, error);
    }
  }

  /**
   * Get scan status
   */
  getScanStatus(scanId: string): ScanStatus | undefined {
    return statuses.get(scanId);
  }

  /**
   * Get scan result
   */
  getScanResult(scanId: string): ScanResult | undefined {
    return results.get(scanId);
  }

  /**
   * Get scan run details
   */
  getScanRun(scanId: string): ScanRun | undefined {
    return runs.get(scanId);
  }

  /**
   * Get all scan IDs
   */
  getAllScanIds(): string[] {
    return Array.from(runs.keys());
  }

  /**
   * Get pool status
   */
  getPoolStatus() {
    return this.pool.getStatus();
  }
} 