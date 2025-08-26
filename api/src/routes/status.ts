import { Router, Request, Response } from 'express';
import { ApiResponse, ScanStatus } from '../core/types';
import { orchestrator } from '../core/shared';
import logger from '../utils/logger';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    logger.info('Health check requested');

    const response: ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      version: string;
    }> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Health check failed', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Health check failed',
    };

    res.status(503).json(response);
  }
});

router.get('/scans', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching all scan statuses');

    const scanIds = orchestrator.getAllScanIds();
    const scans = scanIds.map(scanId => {
      const status = orchestrator.getScanStatus(scanId);
      const scanRun = orchestrator.getScanRun(scanId);
      const lastUpdated = scanRun?.endTime || scanRun?.startTime || new Date();
      
      return {
        scanId,
        status,
        lastUpdated: lastUpdated.toISOString(),
        progress: scanRun ? {
          totalTests: scanRun.summary.totalTests,
          completedTests: scanRun.summary.completedTests,
          failedTests: scanRun.summary.failedTests,
        } : undefined
      };
    });

    const response: ApiResponse<typeof scans> = {
      success: true,
      data: scans,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching scan statuses', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    res.status(500).json(response);
  }
});

router.get('/:scanId', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    if (!scanId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Scan ID is required',
      };
      return res.status(400).json(response);
    }
    
    logger.info('Fetching scan status', { scanId });

    const status = orchestrator.getScanStatus(scanId);
    
    if (status === undefined) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Scan not found',
      };
      return res.status(404).json(response);
    }

    const scanRun = orchestrator.getScanRun(scanId);
    const lastUpdated = scanRun?.endTime || scanRun?.startTime || new Date();

    const response: ApiResponse<{
      scanId: string;
      status: ScanStatus;
      lastUpdated: string;
      progress?: {
        totalTests: number;
        completedTests: number;
        failedTests: number;
      };
    }> = {
      success: true,
      data: {
        scanId,
        status,
        lastUpdated: lastUpdated.toISOString(),
        ...(scanRun && {
          progress: {
            totalTests: scanRun.summary.totalTests,
            completedTests: scanRun.summary.completedTests,
            failedTests: scanRun.summary.failedTests,
          }
        })
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching scan status', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return res.status(500).json(response);
  }
});

export default router; 