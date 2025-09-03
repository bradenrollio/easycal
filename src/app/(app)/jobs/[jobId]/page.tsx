'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobItem {
  id: string;
  input: any;
  result: any;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

interface Job {
  id: string;
  type: 'create_calendars' | 'delete_calendars';
  status: 'queued' | 'running' | 'success' | 'error';
  total: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
  items: JobItem[];
}

// Mock data for demonstration
const mockJob: Job = {
  id: 'job_123',
  type: 'create_calendars',
  status: 'running',
  total: 150,
  successCount: 87,
  errorCount: 12,
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  items: Array.from({ length: 150 }, (_, i) => ({
    id: `item_${i + 1}`,
    input: {
      name: `Calendar ${i + 1}`,
      slug: `calendar-${i + 1}`,
    },
    result: i < 87 ? { calendarId: `cal_${i + 1}` } : null,
    status: i < 87 ? 'success' : i < 99 ? 'error' : 'processing',
    errorMessage: i >= 87 && i < 99 ? 'Slug already exists' : undefined,
  })),
};

import { useParams } from 'next/navigation';

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job>(mockJob);
  const [isPolling, setIsPolling] = useState(true);

  // Simulate polling for job updates
  useEffect(() => {
    if (!isPolling || job.status === 'success' || job.status === 'error') {
      return;
    }

    const interval = setInterval(() => {
      // Simulate job progress
      setJob(prev => {
        if (prev.successCount + prev.errorCount >= prev.total) {
          return { ...prev, status: 'success' as const };
        }

        const newSuccessCount = Math.min(prev.successCount + Math.floor(Math.random() * 3), prev.total - prev.errorCount);
        const newItems = prev.items.map((item, index) => {
          if (index < newSuccessCount && item.status === 'processing') {
            return { ...item, status: 'success' as const };
          }
          return item;
        });

        return {
          ...prev,
          successCount: newSuccessCount,
          updatedAt: new Date().toISOString(),
          items: newItems,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, job.status]);

  const progressPercentage = Math.round(((job.successCount + job.errorCount) / job.total) * 100);
  const isComplete = job.status === 'success' || job.status === 'error';

  const handleExportResults = () => {
    const results = job.items.map(item => ({
      name: item.input.name,
      status: item.status,
      calendarId: item.result?.calendarId || '',
      error: item.errorMessage || '',
    }));

    const csv = [
      ['Name', 'Status', 'Calendar ID', 'Error'],
      ...results.map(r => [r.name, r.status, r.calendarId, r.error])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${job.id}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: JobItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: JobItem['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">
            {job.type === 'create_calendars' ? 'Create Calendars' : 'Delete Calendars'} Job
          </h1>
          <p className="text-muted-foreground">
            Job ID: {job.id} • Started {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg p-6 border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-navy">Progress</h2>
            <span className="text-sm text-muted-foreground">
              {job.successCount + job.errorCount} of {job.total} completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-3 mb-4">
            <div
              className="bg-brand-yellow h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{job.successCount}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{job.errorCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{job.total - job.successCount - job.errorCount}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center justify-center">
            {job.status === 'running' && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Processing...</span>
              </div>
            )}
            {job.status === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Completed Successfully</span>
              </div>
            )}
            {job.status === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Completed with Errors</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-navy">Results</h2>
            {isComplete && (
              <Button onClick={handleExportResults} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Result</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Error</th>
                </tr>
              </thead>
              <tbody>
                {job.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={`text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.input.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.result?.calendarId ? (
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {item.result.calendarId}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.errorMessage ? (
                        <span className="text-red-600">{item.errorMessage}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <a href="/calendars">Back to Calendars</a>
          </Button>

          {isComplete && (
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button asChild>
                <a href="/import">Import More</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
