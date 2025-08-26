import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import { config } from './config';

// Import routes
import scanRoutes from './routes/scan';
import statusRoutes from './routes/status';
import resultsRoutes from './routes/results';

// Note: Environment variables are loaded in config.ts

const app = express();
const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for POST /scan endpoint
const scanRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many scan requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to scan routes
app.use('/api/scan', scanRateLimit);

// Routes - mount under /api
app.use('/api/scan', scanRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/results', resultsRoutes);

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test Ollama connection if configured
    let ollamaStatus = 'not configured';
    if (config.OLLAMA.BASE_URL && config.OLLAMA.MODEL) {
      try {
        const { OllamaAdapter } = await import('./adapters/ollamaAdapter');
        const adapter = new OllamaAdapter(
          config.OLLAMA.BASE_URL,
          config.OLLAMA.MODEL,
          config.OLLAMA.TEMPERATURE,
          config.OLLAMA.TIMEOUT
        );
        const isConnected = await adapter.testConnection();
        ollamaStatus = isConnected ? 'connected' : 'connection failed';
      } catch (error) {
        ollamaStatus = 'error testing connection';
      }
    }

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        ollama: {
          status: ollamaStatus,
          baseUrl: config.OLLAMA.BASE_URL || 'not set',
          model: config.OLLAMA.MODEL || 'not set'
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Chatbot Multi-turn Tester API',
      version: '1.0.0',
      endpoints: {
        scan: '/api/scan',
        status: '/api/status',
        results: '/api/results',
        health: '/health',
      },
    },
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 