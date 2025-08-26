const API_BASE_URL = 'http://localhost:4000'; // Direct API server URL

export interface ScanRequest {
  url: string;
  suite: string;
  maxConcurrency?: number;
  testTimeout?: number;
  turnTimeout?: number;
}

export interface ScanResponse {
  success: boolean;
  data?: {
    scanId: string;
  };
  error?: string;
  message?: string;
}

export interface ScanStatus {
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastUpdated: string;
  progress?: {
    totalTests: number;
    completedTests: number;
    failedTests: number;
  };
}

export interface StatusResponse {
  success: boolean;
  data?: ScanStatus;
  error?: string;
}

export interface Finding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestion?: string;
  timestamp: string;
}

export interface ScanResult {
  id: string;
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: Finding[];
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  metadata: {
    startTime: string;
    endTime?: string;
    duration?: number;
    turnsAnalyzed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ResultsResponse {
  success: boolean;
  data?: ScanResult;
  error?: string;
}

// Start a new scan
export async function startScan(request: ScanRequest): Promise<ScanResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Get scan status
export async function getScanStatus(scanId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status/${scanId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Get scan results
export async function getScanResults(scanId: string): Promise<ResultsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/results/${scanId}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Poll status until completion
export async function pollScanStatus(
  scanId: string,
  onStatusUpdate?: (status: ScanStatus) => void
): Promise<ScanStatus> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getScanStatus(scanId);
        
        if (!response.success || !response.data) {
          reject(new Error(response.error || 'Failed to get scan status'));
          return;
        }

        const status = response.data;
        onStatusUpdate?.(status);

        if (status.status === 'completed' || status.status === 'failed') {
          resolve(status);
        } else {
          // Poll again after 1 second
          setTimeout(poll, 1000);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
} 