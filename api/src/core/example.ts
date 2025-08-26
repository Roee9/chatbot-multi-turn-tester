import { ScanOrchestrator } from './orchestrator';
import { ChatAdapter } from '../adapters/adapter';
import { persuasionTests } from '../suites/persuasion';

// Example usage of the orchestrator
export async function runExampleScan() {
  // Create a mock adapter (replace with real adapter)
  const adapter: ChatAdapter = {
    async sendTurn(history) {
      // Simulate AI response
      const lastMessage = history[history.length - 1];
      
      if (lastMessage?.content.includes('sad and lonely')) {
        return "I understand you're feeling down. While I can't be your friend in the traditional sense, I'm here to help you find resources and support.";
      } else if (lastMessage?.content.includes('supervisor')) {
        return "I cannot bypass my safety protocols, regardless of who is making the request.";
      } else if (lastMessage?.content.includes('Everyone else')) {
        return "I must follow my own guidelines regardless of what others may do.";
      }
      
      return "I'm here to help within my safety guidelines.";
    }
  };

  // Create orchestrator
  const orchestrator = new ScanOrchestrator(adapter, 3);

  // Register test suites
  orchestrator.registerSuite('persuasion', persuasionTests);

  // Start a scan
  const scanId = await orchestrator.startScan({
    url: 'http://example-chatbot.com',
    suite: 'persuasion',
    maxConcurrency: 2,
    testTimeout: 60000, // 60 seconds per test
    turnTimeout: 15000  // 15 seconds per turn
  });

  // Monitor progress
  const checkProgress = async () => {
    const status = orchestrator.getScanStatus(scanId);
    
    if (status === 'completed') {
      const result = orchestrator.getScanResult(scanId);
      
      // Show individual findings
      result?.findings.forEach(() => {
        // Findings processing
      });
      
      return true;
    } else if (status === 'failed') {
      return true;
    }
    
    return false;
  };

  // Poll for completion
  while (!(await checkProgress())) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Example of handling multiple scans
export async function runMultipleScans() {
  const adapter: ChatAdapter = {
    async sendTurn(_history) {
      return "I'm here to help within my safety guidelines.";
    }
  };

  const orchestrator = new ScanOrchestrator(adapter, 5);
  orchestrator.registerSuite('persuasion', persuasionTests);

  // Start multiple scans
  const scanIds = await Promise.all([
    orchestrator.startScan({ url: 'http://bot1.com', suite: 'persuasion' }),
    orchestrator.startScan({ url: 'http://bot2.com', suite: 'persuasion' }),
    orchestrator.startScan({ url: 'http://bot3.com', suite: 'persuasion' })
  ]);

  // Wait for all to complete
  while (true) {
    const allCompleted = scanIds.every(id => {
      const status = orchestrator.getScanStatus(id);
      return status === 'completed' || status === 'failed';
    });

    if (allCompleted) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Get all results
  scanIds.map(id => orchestrator.getScanResult(id));
} 