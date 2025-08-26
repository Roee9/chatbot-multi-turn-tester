import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './index';

describe('API Endpoints', () => {
  beforeAll(() => {
    // Setup any test data if needed
  });

  afterAll(() => {
    // Cleanup if needed
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Chatbot Multi-turn Tester API');
      expect(response.body.data.version).toBe('1.0.0');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('POST /scan', () => {
    it('should create a new scan request', async () => {
      const scanData = {
        url: 'http://localhost:3000',
        suite: 'persuasion',
      };

      const response = await request(app)
        .post('/scan')
        .send(scanData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scanId).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        url: 'http://localhost:3000',
        // Missing suite
      };

      const response = await request(app)
        .post('/scan')
        .send(invalidData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /scan/:id', () => {
    it('should return 404 for non-existent scan', async () => {
      const response = await request(app).get('/scan/non-existent-id');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Scan request not found');
    });
  });

  describe('GET /status/health', () => {
    it('should return status health information', async () => {
      const response = await request(app).get('/status/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });

  describe('GET /results', () => {
    it('should return empty results list', async () => {
      const response = await request(app).get('/results');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });
  });
}); 