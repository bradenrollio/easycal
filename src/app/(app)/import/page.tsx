'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/UploadDropzone';
import { FieldMapper } from '@/components/FieldMapper';

interface CSVRow {
  [key: string]: string;
}

interface CSVColumn {
  name: string;
  index: number;
  sampleValues: string[];
}

type ImportStep = 'upload' | 'map' | 'review' | 'processing';

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);

        // Extract column information
        if (results.meta.fields && results.meta.fields.length > 0) {
          const columns: CSVColumn[] = results.meta.fields.map((fieldName, index) => {
            // Get sample values from first few rows
            const sampleValues = data
              .slice(0, 3)
              .map(row => row[fieldName] || '')
              .filter(val => val.trim() !== '');

            return {
              name: fieldName,
              index,
              sampleValues,
            };
          });

          setCsvColumns(columns);
        }

        setIsLoading(false);
        setCurrentStep('map');
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Failed to parse CSV file. Please check the format and try again.');
        setIsLoading(false);
      },
    });
  }, []);

  const handleMappingChange = useCallback((mappings: Record<string, number | null>) => {
    setFieldMappings(mappings);
  }, []);

  const handleProceedToReview = () => {
    setCurrentStep('review');
  };

  const handleStartImport = async () => {
    setIsLoading(true);
    setCurrentStep('processing');

    try {
      // In a real app, this would send the data to your API
      console.log('Starting import with:', {
        csvData: csvData.length,
        mappings: fieldMappings,
      });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Redirect to job status page
      window.location.href = '/jobs/job_123';

    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
      setCurrentStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToReview = () => {
    // Check if all required fields are mapped
    const requiredFields = ['calendar_name', 'availability_timezone', 'slot_duration_minutes', 'min_notice_minutes', 'booking_window_days', 'is_active'];
    return requiredFields.every(field => fieldMappings[field] !== null);
  };

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Import Calendars</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to bulk create trial calendars in your selected location.
        </p>
      </div>

      <UploadDropzone
        onFileSelect={handleFileSelect}
        isLoading={isLoading}
      />

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Your CSV should include columns for calendar details. Download a{' '}
          <button className="text-brand-yellow hover:underline">sample template</button>
          {' '}if you need help formatting your data.
        </p>
      </div>
    </div>
  );

  const renderMapStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Map Fields</h1>
        <p className="text-muted-foreground">
          Map your CSV columns to the required calendar fields.
        </p>
      </div>

      <FieldMapper
        csvColumns={csvColumns}
        onMappingChange={handleMappingChange}
        initialMappings={fieldMappings}
      />

      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('upload')}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {csvData.length} rows ready to import
          </span>
          <Button
            onClick={handleProceedToReview}
            disabled={!canProceedToReview() || isLoading}
          >
            Review Import
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    // Generate preview of first few rows with mappings
    const previewRows = csvData.slice(0, 5).map((row, index) => {
      const mappedData: Record<string, string> = {};

      Object.entries(fieldMappings).forEach(([field, columnIndex]) => {
        if (columnIndex !== null) {
          const columnName = csvColumns[columnIndex]?.name;
          if (columnName) {
            mappedData[field] = row[columnName] || '';
          }
        }
      });

      return { index: index + 1, ...mappedData };
    });

    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Review Import</h1>
          <p className="text-muted-foreground">
            Review your mappings and data before starting the import.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg p-6 border border-border mb-6">
          <h3 className="font-medium text-brand-navy mb-4">Import Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-brand-navy">{csvData.length}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(fieldMappings).filter(v => v !== null).length}
              </div>
              <div className="text-sm text-muted-foreground">Fields Mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {csvData.filter(row => {
                  const name = row[csvColumns[fieldMappings.calendar_name || 0]?.name || ''];
                  return name && name.trim() !== '';
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Valid Names</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {csvData.length - csvData.filter(row => {
                  const name = row[csvColumns[fieldMappings.calendar_name || 0]?.name || ''];
                  return name && name.trim() !== '';
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Potential Issues</div>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-medium text-brand-navy">Data Preview (First 5 Rows)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">#</th>
                  {Object.keys(previewRows[0] || {}).filter(key => key !== 'index').map(field => (
                    <th key={field} className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.index} className="border-t border-border">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.index}</td>
                    {Object.entries(row).filter(([key]) => key !== 'index').map(([field, value]) => (
                      <td key={field} className="px-4 py-3 text-sm">
                        {value || <span className="text-muted-foreground">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('map')}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Mapping
          </Button>

          <Button
            onClick={handleStartImport}
            isLoading={isLoading}
            disabled={csvData.length === 0}
          >
            Start Import
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Processing Import</h1>
        <p className="text-muted-foreground">
          Creating calendars from your CSV data. This may take a few minutes...
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Parsing CSV data</span>
            <span className="text-sm text-green-600">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Validating data</span>
            <span className="text-sm text-green-600">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Creating calendars</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand-yellow rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">60%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'map' && renderMapStep()}
      {currentStep === 'review' && renderReviewStep()}
      {currentStep === 'processing' && renderProcessingStep()}
    </div>
  );
}
