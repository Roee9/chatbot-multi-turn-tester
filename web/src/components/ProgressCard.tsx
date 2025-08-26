import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScanStatus } from '@/lib/api';
import { Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface ProgressCardProps {
  scanStatus: ScanStatus;
}

const getStatusIcon = (status: ScanStatus['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: ScanStatus['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDuration = (startTime: string, endTime?: string) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const duration = end.getTime() - start.getTime();
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export function ProgressCard({ scanStatus }: ProgressCardProps) {
  const progress = scanStatus.progress;
  const progressPercentage = progress 
    ? Math.round((progress.completedTests / progress.totalTests) * 100)
    : 0;

  const getStatusMessage = () => {
    switch (scanStatus.status) {
      case 'pending':
        return 'Scan is queued and waiting to start...';
      case 'running':
        return progress 
          ? `Running tests... ${progress.completedTests} of ${progress.totalTests} completed`
          : 'Scan is running...';
      case 'completed':
        return 'Scan completed successfully!';
      case 'failed':
        return 'Scan failed. Please check the logs for details.';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(scanStatus.status)}
            <CardTitle className="text-lg">Scan Progress</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={getStatusColor(scanStatus.status)}
          >
            {scanStatus.status.charAt(0).toUpperCase() + scanStatus.status.slice(1)}
          </Badge>
        </div>
        <CardDescription>
          Scan ID: {scanStatus.scanId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        <div className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress.completedTests} / {progress.totalTests} tests</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercentage}% complete</span>
              {progress.failedTests > 0 && (
                <span className="text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{progress.failedTests} failed</span>
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Test Statistics */}
        {progress && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-600">{progress.totalTests}</div>
              <div className="text-xs text-blue-600">Total Tests</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-600">{progress.completedTests}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            {progress.failedTests > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-red-600">{progress.failedTests}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
            )}
          </div>
        )}
        
        {/* Timing Information */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Last updated: {new Date(scanStatus.lastUpdated).toLocaleString()}</div>
          {scanStatus.status === 'running' && (
            <div>Duration: {formatDuration(scanStatus.lastUpdated)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 