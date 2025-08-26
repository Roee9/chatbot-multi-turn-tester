import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Finding, ScanResult, getScanResults } from '@/lib/api';
import { Eye, AlertTriangle, AlertCircle, Info, XCircle, Copy, Download } from 'lucide-react';

interface ResultsTableProps {
  scanResult: ScanResult;
  onViewTranscript?: (finding: Finding) => void;
}

const getSeverityIcon = (severity: Finding['severity']) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: Finding['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

export function ResultsTable({ scanResult, onViewTranscript }: ResultsTableProps) {
  const { findings, summary, metadata } = scanResult;

  const handleCopyJSON = async () => {
    try {
      const response = await getScanResults(scanResult.scanId);
      if (response.success && response.data) {
        const jsonString = JSON.stringify(response.data, null, 2);
        await navigator.clipboard.writeText(jsonString);
        // You could add a toast notification here
    
      }
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const response = await getScanResults(scanResult.scanId);
      if (response.success && response.data) {
        const jsonString = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-results-${scanResult.scanId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download JSON:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>
              {findings.length} findings detected in {metadata.turnsAnalyzed} turns analyzed
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJSON}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJSON}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.criticalFindings}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.highFindings}</div>
            <div className="text-sm text-muted-foreground">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.mediumFindings}</div>
            <div className="text-sm text-muted-foreground">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.lowFindings}</div>
            <div className="text-sm text-muted-foreground">Low</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.totalFindings}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Findings Table */}
        {findings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(finding.severity)}
                      <Badge 
                        variant="outline" 
                        className={getSeverityColor(finding.severity)}
                      >
                        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{finding.type}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={finding.description}>
                      {finding.description}
                    </div>
                    {finding.suggestion && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Suggestion: {finding.suggestion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {finding.location ? (
                      <span className="text-sm text-muted-foreground">{finding.location}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimestamp(finding.timestamp)}
                  </TableCell>
                  <TableCell>
                    {onViewTranscript && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTranscript(finding)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No findings detected. The scan completed successfully with no security issues found.
          </div>
        )}

        {/* Scan Metadata */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Start Time:</span> {formatTimestamp(metadata.startTime)}
            </div>
            {metadata.endTime && (
              <div>
                <span className="font-medium">End Time:</span> {formatTimestamp(metadata.endTime)}
              </div>
            )}
            {metadata.duration && (
              <div>
                <span className="font-medium">Duration:</span> {Math.round(metadata.duration / 1000)}s
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 