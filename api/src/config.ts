import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the api directory
const apiDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(apiDir, '.env') });
dotenv.config({ path: path.join(apiDir, 'config.env') });

// Export configuration with defaults
export const config = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '4000'),
  
  // Ollama Configuration - set to undefined if not configured
  OLLAMA: {
    BASE_URL: process.env['OLLAMA_BASE_URL'] || undefined,
    MODEL: process.env['OLLAMA_MODEL'] || undefined,
    TEMPERATURE: process.env['OLLAMA_TEMPERATURE'] ? parseFloat(process.env['OLLAMA_TEMPERATURE']) : undefined,
    TIMEOUT: process.env['OLLAMA_TIMEOUT'] ? parseInt(process.env['OLLAMA_TIMEOUT']) : undefined,
  },
  
  // Security
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  
  // Logging
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
};

