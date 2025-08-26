import { z } from 'zod';

// Zod schemas for validation
export const TranscriptMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date().optional(),
});

export const FindingSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  location: z.string().optional(),
  suggestion: z.string().optional(),
  timestamp: z.date(),
});

export const ScanRequestSchema = z.object({
  url: z.string().url(),
  suite: z.string(),
  maxConcurrency: z.number().optional(),
  testTimeout: z.number().optional(),
  turnTimeout: z.number().optional(),
});

export const LegacyScanRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  transcript: z.array(TranscriptMessageSchema),
  config: z.object({
    maxTurns: z.number().optional(),
    timeout: z.number().optional(),
    rules: z.array(z.string()).optional(),
  }).optional(),
  createdAt: z.date(),
});

export const ScanStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);

export const ScanResultSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  status: ScanStatusSchema,
  findings: z.array(FindingSchema),
  summary: z.object({
    totalFindings: z.number(),
    criticalFindings: z.number(),
    highFindings: z.number(),
    mediumFindings: z.number(),
    lowFindings: z.number(),
  }),
  metadata: z.object({
    startTime: z.date(),
    endTime: z.date().optional(),
    duration: z.number().optional(),
    turnsAnalyzed: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript types derived from Zod schemas
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type ScanRequest = z.infer<typeof ScanRequestSchema>;
export type LegacyScanRequest = z.infer<typeof LegacyScanRequestSchema>;
export type ScanStatus = z.infer<typeof ScanStatusSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;

// Additional utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 