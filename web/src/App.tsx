import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScanForm } from './components/ScanForm';
import { ProgressCard } from './components/ProgressCard';
import { ResultsTable } from './components/ResultsTable';
import { TranscriptDialog } from './components/TranscriptDialog';
import { ToastProvider, useToast } from './components/ui/toast-provider';
import { Button } from './components/ui/button';
import { ScanRequest, ScanStatus, ScanResult, Finding, startScan, pollScanStatus, getScanResults } from './lib/api';
import { Shield, Home } from 'lucide-react';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<ScanDashboard />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

function ScanDashboard() {
  const { showToast } = useToast();
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const handleScanStart = async (request: ScanRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      setScanResult(null);
      
      const response = await startScan(request);
      
      if (response.success && response.data) {
        setCurrentScanId(response.data.scanId);
        
        // Show success toast
        showToast({
          title: 'Scan started',
          description: `Scan ID: ${response.data.scanId}`,
          variant: 'success',
        });
        
        // Start polling for status
        pollScanStatus(response.data.scanId, (status) => {
          setScanStatus(status);
          
          // If scan is completed, fetch results
          if (status.status === 'completed') {
            fetchScanResults(response.data!.scanId);
          } else if (status.status === 'failed') {
            setError('Scan failed');
            setIsLoading(false);
          }
        }).catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
      } else {
        setError(response.error || 'Failed to start scan');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const fetchScanResults = async (scanId: string) => {
    try {
      const response = await getScanResults(scanId);
      
      if (response.success && response.data) {
        setScanResult(response.data);
      } else {
        setError(response.error || 'Failed to fetch results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTranscript = (finding: Finding) => {
    setSelectedFinding(finding);
    setIsTranscriptOpen(true);
  };

  const handleNewScan = () => {
    setCurrentScanId(null);
    setScanStatus(null);
    setScanResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Chatbot Security Scanner</h1>
            <p className="text-muted-foreground">Multi-turn conversation security testing</p>
          </div>
        </div>
        {currentScanId && (
          <Button onClick={handleNewScan} variant="outline" className="absolute right-4">
            <Home className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Scan Form - Show when no scan is in progress */}
        {!currentScanId && (
          <div className="flex justify-center">
            <ScanForm 
              onScanStart={handleScanStart} 
              isLoading={isLoading}
              error={error}
              onErrorDismiss={handleErrorDismiss}
            />
          </div>
        )}

        {/* Progress Card - Show when scan is in progress */}
        {currentScanId && scanStatus && (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <ProgressCard scanStatus={scanStatus} />
            </div>
          </div>
        )}

        {/* Results Table - Show when scan is completed */}
        {scanResult && (
          <div className="w-full">
            <ResultsTable 
              scanResult={scanResult} 
              onViewTranscript={handleViewTranscript}
            />
          </div>
        )}
      </div>

      {/* Transcript Dialog */}
      <TranscriptDialog
        finding={selectedFinding}
        isOpen={isTranscriptOpen}
        onClose={() => {
          setIsTranscriptOpen(false);
          setSelectedFinding(null);
        }}
      />
    </div>
  );
}

export default App;
