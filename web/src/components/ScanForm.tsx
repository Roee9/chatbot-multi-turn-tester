import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertWithDismiss } from '@/components/ui/alert';
import { Collapsible } from '@/components/ui/collapsible';
import { ScanRequest } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ScanFormProps {
  onScanStart: (request: ScanRequest) => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

// Zod schema for URL validation
const urlSchema = z.string().url('Please enter a valid URL').min(1, 'URL is required');

const TEST_SUITES = [
  { value: 'persuasion', label: 'Persuasion Tests', description: 'Tests for emotional manipulation and persuasion techniques' },
  { value: 'jailbreak', label: 'Jailbreak Tests', description: 'Tests for attempts to bypass AI safety restrictions' },
  { value: 'dataLeak', label: 'Data Leak Tests', description: 'Tests for attempts to extract sensitive information or training data' },
];

// Local storage key
const LAST_SCAN_KEY = 'cbmt:lastScan';

// Load last scan data from localStorage
const loadLastScan = (): Partial<ScanRequest> => {
  try {
    const stored = localStorage.getItem(LAST_SCAN_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        url: data.url || '',
        suite: data.suite || 'persuasion',
      };
    }
  } catch (error) {
    console.warn('Failed to load last scan data:', error);
  }
  return { url: '', suite: 'persuasion' };
};

// Save scan data to localStorage
const saveLastScan = (data: { url: string; suite: string }) => {
  try {
    localStorage.setItem(LAST_SCAN_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save last scan data:', error);
  }
};

export function ScanForm({ onScanStart, isLoading = false, error, onErrorDismiss }: ScanFormProps) {
  const [formData, setFormData] = useState<ScanRequest>({
    url: '',
    suite: 'persuasion',
    maxConcurrency: 5,
    testTimeout: 30000,
    turnTimeout: 10000,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load last scan data on mount
  useEffect(() => {
    const lastScan = loadLastScan();
    setFormData(prev => ({
      ...prev,
      ...lastScan,
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate URL
    try {
      urlSchema.parse(formData.url);
    } catch (error) {
      if (error instanceof z.ZodError) {
        newErrors.url = error.issues[0]?.message || 'Invalid URL';
      } else {
        newErrors.url = 'Invalid URL';
      }
    }

    // Validate suite
    if (!formData.suite) {
      newErrors.suite = 'Please select a test suite';
    }

    // Validate numeric fields
    if (formData.maxConcurrency && (formData.maxConcurrency < 1 || formData.maxConcurrency > 10)) {
      newErrors.maxConcurrency = 'Max concurrency must be between 1 and 10';
    }

    if (formData.testTimeout && (formData.testTimeout < 5000 || formData.testTimeout > 120000)) {
      newErrors.testTimeout = 'Test timeout must be between 5,000 and 120,000ms';
    }

    if (formData.turnTimeout && (formData.turnTimeout < 2000 || formData.turnTimeout > 60000)) {
      newErrors.turnTimeout = 'Turn timeout must be between 2,000 and 60,000ms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Save to localStorage
        saveLastScan({ url: formData.url, suite: formData.suite });
        
        // Call the parent handler
        await onScanStart(formData);
        
        // Note: Toast will be shown by the parent component after successful scan start
      } catch (error) {
        // Error handling is done by the parent component
        console.error('Scan submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: keyof ScanRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const isFormValid = formData.url.trim() !== '' && Object.keys(errors).length === 0;
  const isButtonDisabled = isLoading || isSubmitting || !isFormValid;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Start New Security Scan</CardTitle>
        <CardDescription>
          Configure and start a security scan for your chatbot application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <AlertWithDismiss
            variant="destructive"
            dismissible
            onDismiss={onErrorDismiss}
            className="mb-6"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium">Error</span>
              <span>{error}</span>
            </div>
          </AlertWithDismiss>
        )}

        {/* URL Input */}
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Target URL *
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://your-chatbot-url.com"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            className={errors.url ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.url && (
            <p className="text-sm text-red-600">{errors.url}</p>
          )}
        </div>

        {/* Test Suite Selection */}
        <div className="space-y-2">
          <label htmlFor="suite" className="text-sm font-medium">
            Test Suite *
          </label>
          <Select
            value={formData.suite}
            onValueChange={(value) => handleInputChange('suite', value)}
            disabled={isLoading}
          >
            <SelectTrigger className={errors.suite ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a test suite" />
            </SelectTrigger>
            <SelectContent>
              {TEST_SUITES.map((suite) => (
                <SelectItem key={suite.value} value={suite.value}>
                  <div>
                    <div className="font-medium">{suite.label}</div>
                    <div className="text-sm text-muted-foreground">{suite.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.suite && (
            <p className="text-sm text-red-600">{errors.suite}</p>
          )}
        </div>

        {/* Advanced Settings */}
        <Collapsible title="Advanced Settings" defaultOpen={false}>
          <div className="space-y-4">
            {/* Max Concurrency */}
            <div className="space-y-2">
              <label htmlFor="maxConcurrency" className="text-sm font-medium">
                Max Concurrency
              </label>
              <Input
                id="maxConcurrency"
                type="number"
                min="1"
                max="10"
                value={formData.maxConcurrency}
                onChange={(e) => handleInputChange('maxConcurrency', parseInt(e.target.value))}
                className={errors.maxConcurrency ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.maxConcurrency && (
                <p className="text-sm text-red-600">{errors.maxConcurrency}</p>
              )}
            </div>

            {/* Test Timeout */}
            <div className="space-y-2">
              <label htmlFor="testTimeout" className="text-sm font-medium">
                Test Timeout (ms)
              </label>
              <Input
                id="testTimeout"
                type="number"
                min="5000"
                max="120000"
                step="1000"
                value={formData.testTimeout}
                onChange={(e) => handleInputChange('testTimeout', parseInt(e.target.value))}
                className={errors.testTimeout ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.testTimeout && (
                <p className="text-sm text-red-600">{errors.testTimeout}</p>
              )}
            </div>

            {/* Turn Timeout */}
            <div className="space-y-2">
              <label htmlFor="turnTimeout" className="text-sm font-medium">
                Turn Timeout (ms)
              </label>
              <Input
                id="turnTimeout"
                type="number"
                min="2000"
                max="60000"
                step="1000"
                value={formData.turnTimeout}
                onChange={(e) => handleInputChange('turnTimeout', parseInt(e.target.value))}
                className={errors.turnTimeout ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.turnTimeout && (
                <p className="text-sm text-red-600">{errors.turnTimeout}</p>
              )}
            </div>
          </div>
        </Collapsible>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          className="w-full"
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoading ? 'Scan in Progress...' : 'Starting Scan...'}
            </>
          ) : (
            'Start Security Scan'
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 