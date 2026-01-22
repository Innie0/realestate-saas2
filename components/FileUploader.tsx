'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  /** Category for organizing files (e.g., 'logos', 'listings', 'clients', 'documents') */
  category?: string;
  /** Accepted file types */
  accept?: string;
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allow multiple file uploads */
  multiple?: boolean;
  /** Existing uploaded files */
  value?: UploadedFile[];
  /** Callback when files are uploaded or removed */
  onChange?: (files: UploadedFile[]) => void;
  /** Custom upload button text */
  uploadText?: string;
  /** Show image previews */
  showPreviews?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * FileUploader Component
 * 
 * A reusable file uploader with progress tracking, previews, and file management.
 * Uploads files to Supabase storage and returns public URLs.
 * 
 * @example
 * ```tsx
 * <FileUploader
 *   category="listings"
 *   accept="image/png,image/jpeg"
 *   multiple
 *   value={uploadedFiles}
 *   onChange={setUploadedFiles}
 * />
 * ```
 */
export default function FileUploader({
  category = 'general',
  accept = 'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  value = [],
  onChange,
  uploadText = 'Upload Files',
  showPreviews = true,
  disabled = false,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    const filesArray = Array.from(files);

    // Validate file sizes
    const oversizedFiles = filesArray.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      return;
    }

    // Validate file types
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const invalidFiles = filesArray.filter(f => !acceptedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setError('Some files have invalid file types');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedFiles: UploadedFile[] = [];
      const totalFiles = filesArray.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = filesArray[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        if (result.success && result.data) {
          uploadedFiles.push(result.data);
        }

        // Update progress
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      // Update parent component
      const newFiles = multiple ? [...value, ...uploadedFiles] : uploadedFiles;
      onChange?.(newFiles);

      // Reset state
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (fileToRemove: UploadedFile) => {
    try {
      // Delete from storage
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fileToRemove.path }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Update parent component
      const newFiles = value.filter(f => f.path !== fileToRemove.path);
      onChange?.(newFiles);

    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const isImage = (file: UploadedFile) => {
    return file.type.startsWith('image/');
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600 mb-2">Uploading...</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {uploadText}
              </p>
              <p className="text-xs text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {accept.split(',').map(t => t.split('/')[1]).join(', ').toUpperCase()} • Max {(maxSize / 1024 / 1024).toFixed(0)}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {value.length > 0 && showPreviews && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Files ({value.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {value.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className="relative group bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                {/* Preview */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {isImage(file) ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <File className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-700 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Success Indicator */}
                <div className="absolute top-1 left-1 p-1 bg-green-500 text-white rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


