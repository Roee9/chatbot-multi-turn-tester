import { Router, Request, Response } from 'express';
import { ScanResult, ApiResponse, PaginatedResponse } from '../core/types';
import { orchestrator } from '../core/shared';
import logger from '../utils/logger';

const router = Router();

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
    
    logger.info('Fetching scan results', { scanId });

    const result = orchestrator.getScanResult(scanId);
    const status = orchestrator.getScanStatus(scanId);
    
    if (!result) {
      if (status === undefined) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Scan not found',
        };
        return res.status(404).json(response);
      } else if (status !== 'completed') {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Scan results not ready yet',
        };
        return res.status(404).json(response);
      }
    }

    const response: ApiResponse<ScanResult> = {
      success: true,
      data: result!,
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching scan results', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return res.status(500).json(response);
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const status = req.query['status'] as string;
    
    logger.info('Fetching scan results', { page, limit, status });

    const scanIds = orchestrator.getAllScanIds();
    let results: ScanResult[] = [];
    
    // Get all completed results
    for (const scanId of scanIds) {
      const result = orchestrator.getScanResult(scanId);
      if (result) {
        results.push(result);
      }
    }
    
    // Filter by status if provided
    if (status) {
      results = results.filter(result => result.status === status);
    }
    
    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    const total = results.length;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<ScanResult> = {
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching scan results', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return res.status(500).json(response);
  }
});

router.get('/:scanId/findings', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    if (!scanId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Scan ID is required',
      };
      return res.status(400).json(response);
    }
    
    const severity = req.query['severity'] as string;
    
    logger.info('Fetching scan findings', { scanId, severity });

    const result = orchestrator.getScanResult(scanId);
    const status = orchestrator.getScanStatus(scanId);
    
    if (!result) {
      if (status === undefined) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Scan not found',
        };
        return res.status(404).json(response);
      } else if (status !== 'completed') {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Scan results not ready yet',
        };
        return res.status(404).json(response);
      }
    }

    let findings = result!.findings;
    
    // Filter by severity if provided
    if (severity) {
      findings = findings.filter(finding => finding.severity === severity);
    }

    const response: ApiResponse<typeof findings> = {
      success: true,
      data: findings,
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error fetching scan findings', { error });
    
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return res.status(500).json(response);
  }
});

export default router; 