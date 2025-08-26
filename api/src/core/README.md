# Core Implementation

This directory contains the core components for the chatbot multi-turn tester:

## Files

### `pool.ts`
A simple concurrency limiter that manages concurrent operations. Features:
- Configurable maximum concurrency
- Queue-based task execution
- Promise-based API
- Status monitoring

### `orchestrator.ts`
The main orchestrator that manages scan execution. Features:
- In-memory stores for runs, statuses, and results
- Concurrent test execution with configurable limits
- Per-test and per-turn timeout handling
- Automatic finding detection and generation
- JSON result export to `samples/<scanId>.json`

### `example.ts`
Example usage of the orchestrator with mock adapters.

### `orchestrator.test.ts`
Comprehensive tests for the orchestrator functionality.

## Usage

```typescript
import { ScanOrchestrator } from './orchestrator';
import { ChatAdapter } from '../adapters/adapter';

// Create an adapter
const adapter: ChatAdapter = {
  async sendTurn(history) {
    // Your AI integration here
    return "AI response";
  }
};

// Create orchestrator
const orchestrator = new ScanOrchestrator(adapter, 5);

// Register test suites
orchestrator.registerSuite('persuasion', persuasionTests);

// Start a scan
const scanId = await orchestrator.startScan({
  url: 'http://your-chatbot.com',
  suite: 'persuasion',
  maxConcurrency: 3,
  testTimeout: 60000,
  turnTimeout: 15000
});

// Monitor progress
const status = orchestrator.getScanStatus(scanId);
const result = orchestrator.getScanResult(scanId);
```

## Configuration Options

- `maxConcurrency`: Maximum number of concurrent tests (default: 5)
- `testTimeout`: Overall timeout per test in milliseconds (default: 30000)
- `turnTimeout`: Timeout per turn in milliseconds (default: 10000)

## In-Memory Stores

The orchestrator maintains three in-memory stores:
- `runs`: Detailed scan run information
- `statuses`: Current status of each scan
- `results`: Final scan results

## Result Format

Results are automatically written to `samples/<scanId>.json` with the following structure:

```json
{
  "id": "scan-id",
  "scanId": "scan-id",
  "status": "completed",
  "findings": [...],
  "summary": {
    "totalTests": 3,
    "completedTests": 3,
    "failedTests": 0,
    "totalFindings": 2,
    "criticalFindings": 1,
    "highFindings": 1,
    "mediumFindings": 0,
    "lowFindings": 0
  },
  "metadata": {
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T00:01:00.000Z",
    "duration": 60000,
    "turnsAnalyzed": 6
  }
}
```

## Error Handling

The orchestrator handles various error scenarios:
- Test timeouts (per-test and per-turn)
- Adapter failures
- Invalid test suites
- File system errors during result export

All errors are captured and logged, with failed tests marked appropriately in the results. 