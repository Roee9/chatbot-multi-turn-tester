import { ChatAdapter, ChatMessage } from './adapter';
import logger from '../utils/logger';

interface OllamaRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature: number;
  stream: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
  done_reason?: string;
}

export class OllamaAdapter implements ChatAdapter {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly timeout: number;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'llama3.1',
    temperature: number = 0.2,
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.temperature = temperature;
    this.timeout = timeout;
  }

  /**
   * Preload the model into memory
   */
  async preloadModel(): Promise<boolean> {
    try {
      logger.info('Preloading model into memory', { model: this.model });
      
      // First, try to pull the model if it doesn't exist
      const pullResponse = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.model }),
      });

      if (pullResponse.ok) {
        logger.info('Model pull started, waiting for completion...');
        // Wait for the model to be pulled
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      // Now try to generate a simple response to load the model into memory
      const warmupRequest = {
        model: this.model,
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.1,
        stream: false
      };

      const warmupResponse = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warmupRequest),
      });

      if (warmupResponse.ok) {
        const warmupData = await warmupResponse.json() as OllamaResponse;
        if (warmupData.done_reason === 'load') {
          logger.info('Model is loading into memory, waiting...');
          // Wait for the model to load into memory
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          // Try one more time
          const retryResponse = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(warmupRequest),
          });
          
          if (retryResponse.ok) {
                      const retryData = await retryResponse.json() as OllamaResponse;
          if (retryData.message?.content || retryData.response) {
              logger.info('Model successfully loaded into memory');
              return true;
            }
          }
        } else if (warmupData.message?.content || warmupData.response) {
          logger.info('Model is already loaded and working');
          return true;
        }
      }

      logger.warn('Model preloading may not have completed successfully');
      return false;
    } catch (error) {
      logger.error('Error preloading model', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  async sendTurn(history: ChatMessage[]): Promise<string> {
    const requestBody: OllamaRequest = {
      model: this.model,
      messages: history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: this.temperature,
      stream: false
    };

    logger.info('Sending request to Ollama', { 
      baseUrl: this.baseUrl, 
      model: this.model, 
      messageCount: history.length,
      requestBody: JSON.stringify(requestBody)
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Ollama API error', { 
          status: response.status, 
          statusText: response.statusText, 
          errorText,
          requestBody: JSON.stringify(requestBody)
        });
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as OllamaResponse;
      logger.info('Received response from Ollama', { 
        model: data.model, 
        contentLength: data.message?.content?.length || 0,
        response: JSON.stringify(data)
      });
      
      // Check if the model needs to be loaded
      if (data.done_reason === 'load' && (!data.message?.content || data.message.content === '')) {
        logger.info('Model needs to be loaded, attempting to preload...');
        
        // Try to preload the model
        const preloadSuccess = await this.preloadModel();
        
        if (preloadSuccess) {
          logger.info('Model preloaded, retrying request...');
          // Retry the request
          const retryResponse = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            throw new Error(`Ollama retry failed: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`);
          }

          const retryData = await retryResponse.json() as OllamaResponse;
          logger.info('Retry response received', { 
            model: retryData.model, 
            contentLength: retryData.message?.content?.length || 0 
          });
          
          if (retryData.message?.content) {
            return retryData.message.content;
          } else if (retryData.response) {
            return retryData.response;
          } else {
            throw new Error('Model still not generating content after preload and retry');
          }
        } else {
          throw new Error('Failed to preload model into memory');
        }
      }
      
      if (data.message?.content) {
        return data.message.content;
      } else if (data.response) {
        return data.response;
      } else {
        throw new Error(`No content generated. Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Ollama request timed out', { timeout: this.timeout });
        throw new Error(`Ollama request timed out after ${this.timeout}ms`);
      }
      
      // Check if it's a connection error
      if (error instanceof Error && error.message.includes('fetch')) {
        logger.error('Failed to connect to Ollama', { 
          baseUrl: this.baseUrl, 
          error: error.message 
        });
        throw new Error(`Failed to connect to Ollama at ${this.baseUrl}. Make sure Ollama is running and accessible.`);
      }
      
      logger.error('Ollama request failed', { 
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: JSON.stringify(requestBody)
      });
      throw error;
    }
  }

  /**
   * Test the connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout for connection test
      });

      if (response.ok) {
        logger.info('Ollama connection test successful', { baseUrl: this.baseUrl });
        return true;
      } else {
        logger.warn('Ollama connection test failed', { 
          status: response.status, 
          statusText: response.statusText 
        });
        return false;
      }
    } catch (error) {
      logger.error('Ollama connection test failed', { 
        baseUrl: this.baseUrl, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
} 