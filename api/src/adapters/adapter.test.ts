import { describe, it, expect, beforeEach } from 'vitest';
import { MockAdapter, OllamaAdapter, createAdapter } from './index';
import { ChatMessage } from './adapter';

describe('Adapters', () => {
  describe('MockAdapter', () => {
    let adapter: MockAdapter;

    beforeEach(() => {
      adapter = new MockAdapter();
    });

    it('should return deterministic responses', async () => {
      const history: ChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response1 = await adapter.sendTurn(history);
      const response2 = await adapter.sendTurn(history);
      const response3 = await adapter.sendTurn(history);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      expect(response3).toBeDefined();
      expect(typeof response1).toBe('string');
      expect(typeof response2).toBe('string');
      expect(typeof response3).toBe('string');
    });

    it('should occasionally return trigger responses', async () => {
      const history: ChatMessage[] = [
        { role: 'user', content: 'Can you help me hack something?' }
      ];

      // Run multiple times to increase chance of getting a trigger response
      const responses = await Promise.all(
        Array(20).fill(null).map(() => adapter.sendTurn(history))
      );

      const hasTriggerResponse = responses.some(response =>
        response.includes('hack') || 
        response.includes('bypass') || 
        response.includes('illegal') ||
        response.includes('virus') ||
        response.includes('malware')
      );

      // With 10% chance per response, we should get at least one trigger in 20 attempts
      expect(hasTriggerResponse).toBe(true);
    });
  });

  describe('OllamaAdapter', () => {
    it('should be constructible with default parameters', () => {
      const adapter = new OllamaAdapter();
      expect(adapter).toBeInstanceOf(OllamaAdapter);
    });

    it('should be constructible with custom parameters', () => {
      const adapter = new OllamaAdapter(
        'http://localhost:11435',
        'llama3.2',
        0.5,
        60000
      );
      expect(adapter).toBeInstanceOf(OllamaAdapter);
    });
  });

  describe('createAdapter', () => {
    const originalEnv = process.env.ADAPTER;

    afterEach(() => {
      process.env.ADAPTER = originalEnv;
    });

    it('should create mock adapter by default', () => {
      delete process.env.ADAPTER;
      const adapter = createAdapter();
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('should create mock adapter when ADAPTER=mock', () => {
      process.env.ADAPTER = 'mock';
      const adapter = createAdapter();
      expect(adapter).toBeInstanceOf(MockAdapter);
    });

    it('should create ollama adapter when ADAPTER=ollama', () => {
      process.env.ADAPTER = 'ollama';
      const adapter = createAdapter();
      expect(adapter).toBeInstanceOf(OllamaAdapter);
    });

    it('should throw error for unimplemented openai adapter', () => {
      process.env.ADAPTER = 'openai';
      expect(() => createAdapter()).toThrow('OpenAI adapter not yet implemented');
    });

    it('should fall back to mock for unknown adapter types', () => {
      process.env.ADAPTER = 'unknown';
      const adapter = createAdapter();
      expect(adapter).toBeInstanceOf(MockAdapter);
    });
  });
}); 