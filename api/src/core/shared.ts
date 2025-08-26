import { ScanOrchestrator } from './orchestrator';
import { MockAdapter } from '../adapters/mockAdapter';
import { OllamaAdapter } from '../adapters/ollamaAdapter';
import { getSuite, getSuiteNames } from '../suites/registry';
import logger from '../utils/logger';
import { config } from '../config';

// Debug: Log configuration
logger.info('Configuration loaded', {
  OLLAMA_BASE_URL: config.OLLAMA.BASE_URL,
  OLLAMA_MODEL: config.OLLAMA.MODEL,
  OLLAMA_TEMPERATURE: config.OLLAMA.TEMPERATURE,
  OLLAMA_TIMEOUT: config.OLLAMA.TIMEOUT,
  NODE_ENV: config.NODE_ENV
});

// Initialize adapter based on configuration
let adapter: any;

const useOllama = config.OLLAMA.BASE_URL && config.OLLAMA.MODEL;

logger.info('Adapter selection', { 
  useOllama, 
  hasBaseUrl: !!config.OLLAMA.BASE_URL, 
  hasModel: !!config.OLLAMA.MODEL 
});

if (useOllama) {
  adapter = new OllamaAdapter(
    config.OLLAMA.BASE_URL, 
    config.OLLAMA.MODEL, 
    config.OLLAMA.TEMPERATURE, 
    config.OLLAMA.TIMEOUT
  );
  logger.info('Using Ollama adapter', { 
    baseUrl: config.OLLAMA.BASE_URL, 
    model: config.OLLAMA.MODEL, 
    temperature: config.OLLAMA.TEMPERATURE, 
    timeout: config.OLLAMA.TIMEOUT 
  });
} else {
  adapter = new MockAdapter();
  logger.info('Using Mock adapter (Ollama not configured)', { 
    reason: !config.OLLAMA.BASE_URL ? 'Missing OLLAMA_BASE_URL' : 'Missing OLLAMA_MODEL' 
  });
}

const orchestrator = new ScanOrchestrator(adapter);

// Register available test suites
const suiteNames = getSuiteNames();
suiteNames.forEach(suiteName => {
  const suite = getSuite(suiteName);
  if (suite) {
    orchestrator.registerSuite(suiteName, suite.tests);
  }
});

export { orchestrator }; 