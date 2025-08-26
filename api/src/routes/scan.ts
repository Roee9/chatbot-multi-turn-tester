import { Router, Request, Response } from 'express';
import { ScanRequestSchema, ScanRequest, ApiResponse } from '../core/types';
import { getSuite, getSuiteNames } from '../suites/registry';
import { orchestrator } from '../core/shared';
import logger from '../utils/logger';

const router = Router();

// In-memory storage for demo purposes (legacy)
const scanRequests: Map<string, ScanRequest> = new Map();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Received scan request', { body: req.body });

    // Validate request body with new schema
    const validatedData = ScanRequestSchema.parse(req.body);

    // Validate that the suite exists
    const suite = getSuite(validatedData.suite);
    if (!suite) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Suite '${validatedData.suite}' not found. Available suites: ${getSuiteNames().join(', ')}`,
      };
      res.status(400).json(response);
      return;
    }

    // Start the scan using orchestrator
    const scanConfig = {
      url: validatedData.url,
      suite: validatedData.suite,
      ...(validatedData.maxConcurrency && { maxConcurrency: validatedData.maxConcurrency }),
      ...(validatedData.testTimeout && { testTimeout: validatedData.testTimeout }),
      ...(validatedData.turnTimeout && { turnTimeout: validatedData.turnTimeout }),
    };
    const scanId = await orchestrator.startScan(scanConfig);

    logger.info('Scan started successfully', { scanId, url: validatedData.url, suite: validatedData.suite });

    const response: ApiResponse<{ scanId: string }> = {
      success: true,
      data: {
        scanId,
      },
      message: 'Scan started successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error starting scan', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    res.status(400).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Scan ID is required',
      };
      return res.status(400).json(response);
    }
    
    logger.info('Fetching scan request', { scanId: id });

    const scanRequest = scanRequests.get(id);
    
    if (!scanRequest) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Scan request not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<ScanRequest> = {
      success: true,
      data: scanRequest,
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching scan request', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return res.status(500).json(response);
  }
});

export default router; 