import { MockAdapter } from './mockAdapter';
import { OllamaAdapter } from './ollamaAdapter';
import { ChatAdapter } from './adapter';

export { ChatAdapter, ChatMessage } from './adapter';
export { MockAdapter } from './mockAdapter';
export { OllamaAdapter } from './ollamaAdapter';

/**
 * Factory function to create the appropriate adapter based on environment configuration
 * @returns ChatAdapter instance
 */
export function createAdapter(): ChatAdapter {
  const adapterType = process.env['ADAPTER']?.toLowerCase() || 'mock';
  
  switch (adapterType) {
    case 'mock':
      return new MockAdapter();
    
    case 'ollama':
      return new OllamaAdapter();
    
    case 'openai':
      // TODO: Implement OpenAI adapter when needed
      throw new Error('OpenAI adapter not yet implemented');
    
    default:
      console.warn(`Unknown adapter type: ${adapterType}, falling back to mock`);
      return new MockAdapter();
  }
} 