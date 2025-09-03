'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
  isLoading?: boolean;
}

export function UploadDropzone({
  onFileSelect,
  acceptedFileTypes = '.csv',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  isLoading = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please select a CSV file';
    }

    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={clsx(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
            isDragOver
              ? 'border-brand-yellow bg-brand-yellow/5'
              : 'border-border hover:border-brand-yellow/50 hover:bg-muted/30',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileInput}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isDragOver ? 'bg-brand-yellow/10' : 'bg-muted'
            )}>
              <Upload className={clsx(
                'w-8 h-8',
                isDragOver ? 'text-brand-yellow' : 'text-muted-foreground'
              )} />
            </div>

            <div>
              <p className="text-lg font-medium text-brand-navy mb-1">
                {isDragOver ? 'Drop your CSV file here' : 'Upload CSV file'}
              </p>
              <p className="text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Supports CSV files up to {Math.round(maxFileSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-white border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-brand-navy truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={removeFile}
              disabled={isLoading}
              className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
