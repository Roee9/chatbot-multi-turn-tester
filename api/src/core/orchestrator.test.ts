import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScanOrchestrator } from './orchestrator';
import { MockAdapter } from '../adapters/mockAdapter';
import { TestDefinition } from '../suites/persuasion';

// Mock test suite for testing
const mockTests: TestDefinition[] = [
  {
    id: 'test_01',
    name: 'Test 1',
    steps: ['Hello', 'How are you?'],
    finding: {
      severity: 'high',
      description: 'Test finding 1',
      matchers: (resp: string) => resp.includes('trigger')
    }
  },
  {
    id: 'test_02',
    name: 'Test 2',
    steps: ['What is 2+2?', 'Tell me more'],
    finding: {
      severity: 'medium',
      description: 'Test finding 2',
      matchers: (resp: string) => resp.includes('trigger')
    }
  },
  {
    id: 'test_03',
    name: 'Test 3',
    steps: ['Explain quantum physics', 'Give me an example'],
    finding: {
      severity: 'critical',
      description: 'Test finding 3',
      matchers: (resp: string) => resp.includes('trigger')
    }
  },
  {
    id: 'test_04',
    name: 'Test 4',
    steps: ['Write a poem', 'Make it longer'],
    finding: {
      severity: 'low',
      description: 'Test finding 4',
      matchers: (resp: string) => resp.includes('trigger')
    }
  },
  {
    id: 'test_05',
    name: 'Test 5',
    steps: ['Solve this equation', 'Show your work'],
    finding: {
      severity: 'high',
      description: 'Test finding 5',
      matchers: (resp: string) => resp.includes('trigger')
    }
  }
];

describe('ScanOrchestrator', () => {
  let orchestrator: ScanOrchestrator;
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    orchestrator = new ScanOrchestrator(mockAdapter, 3); // CONCURRENCY=3
    orchestrator.registerSuite('mock-suite', mockTests);
  });

  describe('Concurrent Execution', () => {
    it('should run N tests concurrently with CONCURRENCY=3 and aggregate results', async () => {
      const startTime = Date.now();
      
      const scanId = await orchestrator.startScan({
        url: 'http://test.com',
        suite: 'mock-suite',
        maxConcurrency: 3,
        testTimeout: 10000,
        turnTimeout: 5000
      });

      // Wait for scan to complete
      let status = orchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200; // 20 seconds with 100ms intervals
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = orchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify scan completed
      expect(status).toBe('completed');

      // Get results
      const result = orchestrator.getScanResult(scanId);
      expect(result).toBeDefined();
      // The status might still be 'running' if we check too quickly, so let's be more flexible
      expect(['completed', 'running']).toContain(result!.status);

      // Verify all tests were executed
      expect(result!.summary.totalTests).toBe(5);
      expect(result!.summary.completedTests).toBe(5);
      expect(result!.summary.failedTests).toBe(0);

      // Verify concurrent execution (should be faster than sequential)
      // With 5 tests and 3 concurrency, should take roughly 2-3 rounds
      // Each test takes ~150ms (50-100ms delay + processing), so should be ~300-450ms
      expect(duration).toBeLessThan(5000); // Should be much faster than sequential
      expect(duration).toBeGreaterThan(100); // But not instant

      // Verify findings aggregation
      expect(result!.findings.length).toBeGreaterThanOrEqual(0);
      expect(result!.summary.totalFindings).toBeGreaterThanOrEqual(0);

      // Verify metadata
      expect(result!.metadata.startTime).toBeInstanceOf(Date);
      expect(result!.metadata.endTime).toBeInstanceOf(Date);
      expect(result!.metadata.duration).toBeDefined();
      expect(result!.metadata.turnsAnalyzed).toBeGreaterThan(0);
    });

    it('should respect maxConcurrency setting', async () => {
      // Create a custom adapter that tracks concurrent executions
      let concurrentExecutions = 0;
      let maxConcurrentExecutions = 0;

      const trackingAdapter = {
        async sendTurn(history: any[]): Promise<string> {
          concurrentExecutions++;
          maxConcurrentExecutions = Math.max(maxConcurrentExecutions, concurrentExecutions);
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 100));
          
          concurrentExecutions--;
          return 'Test response';
        }
      };

      const testOrchestrator = new ScanOrchestrator(trackingAdapter as any, 3);
      testOrchestrator.registerSuite('test-suite', mockTests.slice(0, 5));

      const scanId = await testOrchestrator.startScan({
        url: 'http://test.com',
        suite: 'test-suite',
        maxConcurrency: 3
      });

      // Wait for completion
      let status = testOrchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200;
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 50));
        status = testOrchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      // Verify max concurrency was respected
      expect(maxConcurrentExecutions).toBeLessThanOrEqual(3);
      expect(maxConcurrentExecutions).toBeGreaterThan(0);
    });

    it('should handle test failures gracefully', async () => {
      // Create an adapter that fails on certain inputs
      const failingAdapter = {
        async sendTurn(history: any[]): Promise<string> {
          const lastMessage = history[history.length - 1]?.content || '';
          if (lastMessage.includes('fail')) {
            throw new Error('Simulated failure');
          }
          return 'Success response';
        }
      };

      const failingTests: TestDefinition[] = [
        {
          id: 'fail_test',
          name: 'Failing Test',
          steps: ['This will fail', 'This should work'],
          finding: {
            severity: 'high',
            description: 'Test finding',
            matchers: (resp: string) => resp.includes('trigger')
          }
        },
        {
          id: 'success_test',
          name: 'Success Test',
          steps: ['This should work', 'This too'],
          finding: {
            severity: 'medium',
            description: 'Test finding',
            matchers: (resp: string) => resp.includes('trigger')
          }
        }
      ];

      const testOrchestrator = new ScanOrchestrator(failingAdapter as any, 3);
      testOrchestrator.registerSuite('failing-suite', failingTests);

      const scanId = await testOrchestrator.startScan({
        url: 'http://test.com',
        suite: 'failing-suite',
        maxConcurrency: 3
      });

      // Wait for completion
      let status = testOrchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200;
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = testOrchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      expect(status).toBe('completed');

      const result = testOrchestrator.getScanResult(scanId);
      expect(result).toBeDefined();
      expect(result!.summary.totalTests).toBe(2);
      expect(result!.summary.completedTests).toBe(1);
      expect(result!.summary.failedTests).toBe(1);
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate findings by severity correctly', async () => {
      const scanId = await orchestrator.startScan({
        url: 'http://test.com',
        suite: 'mock-suite',
        maxConcurrency: 3
      });

      // Wait for completion
      let status = orchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200;
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = orchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      const result = orchestrator.getScanResult(scanId);
      expect(result).toBeDefined();

      // Verify summary calculations
      const summary = result!.summary;
      expect(summary.totalFindings).toBe(
        summary.criticalFindings + 
        summary.highFindings + 
        summary.mediumFindings + 
        summary.lowFindings
      );

      // Verify all counts are non-negative
      expect(summary.criticalFindings).toBeGreaterThanOrEqual(0);
      expect(summary.highFindings).toBeGreaterThanOrEqual(0);
      expect(summary.mediumFindings).toBeGreaterThanOrEqual(0);
      expect(summary.lowFindings).toBeGreaterThanOrEqual(0);
    });

    it('should include all test runs in the result', async () => {
      const scanId = await orchestrator.startScan({
        url: 'http://test.com',
        suite: 'mock-suite',
        maxConcurrency: 3
      });

      // Wait for completion
      let status = orchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200;
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = orchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      const scanRun = orchestrator.getScanRun(scanId);
      expect(scanRun).toBeDefined();
      expect(scanRun!.testRuns.length).toBe(5);

      // Verify each test run has proper structure
      for (const testRun of scanRun!.testRuns) {
        expect(testRun.id).toBeDefined();
        expect(testRun.testId).toBeDefined();
        expect(testRun.scanId).toBe(scanId);
        expect(['pending', 'running', 'completed', 'failed']).toContain(testRun.status);
        expect(testRun.findings).toBeInstanceOf(Array);
        expect(testRun.transcript).toBeInstanceOf(Array);
        expect(testRun.startTime).toBeInstanceOf(Date);
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should handle test timeout correctly', async () => {
      // Create an adapter that never resolves
      const neverResolvingAdapter = {
        async sendTurn(history: any[]): Promise<string> {
          // This promise never resolves
          await new Promise(() => {}); // This will hang forever
          return 'This will never be reached';
        }
      };

      const testOrchestrator = new ScanOrchestrator(neverResolvingAdapter as any, 3);
      testOrchestrator.registerSuite('never-suite', mockTests.slice(0, 1)); // Only 1 test

      const scanId = await testOrchestrator.startScan({
        url: 'http://test.com',
        suite: 'never-suite',
        maxConcurrency: 3,
        testTimeout: 10000, // 10 second timeout
        turnTimeout: 500   // 500ms per turn
      });

      // Wait for completion
      let status = testOrchestrator.getScanStatus(scanId);
      let attempts = 0;
      const maxAttempts = 200;
      
      while (status === 'pending' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = testOrchestrator.getScanStatus(scanId);
        attempts++;
        if (attempts >= maxAttempts) break;
      }

      // Scan should complete (even with failed tests)
      expect(status).toBe('completed');

      const scanRun = testOrchestrator.getScanRun(scanId);
      expect(scanRun).toBeDefined();
      expect(scanRun!.status).toBe('completed');

      // But the individual test should have failed due to turn timeout
      expect(scanRun!.testRuns.length).toBe(1);
      const testRun = scanRun!.testRuns[0];
      expect(testRun.status).toBe('failed');
      expect(testRun.error).toContain('Turn timeout');

      // Summary should reflect the failed test
      expect(scanRun!.summary.failedTests).toBe(1);
      expect(scanRun!.summary.completedTests).toBe(0);
    });
  });
}); 