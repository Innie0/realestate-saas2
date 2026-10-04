'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  File,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import type { Contract } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';

const CONTRACT_TYPES = [
  { value: 'purchase_agreement', label: 'Purchase Agreement' },
  { value: 'listing_agreement', label: 'Listing Agreement' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'offer', label: 'Offer' },
  { value: 'counter_offer', label: 'Counter Offer' },
  { value: 'addendum', label: 'Addendum' },
  { value: 'disclosure', label: 'Disclosure' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'other', label: 'Other' },
] as const;

const TYPE_LABELS = Object.fromEntries(CONTRACT_TYPES.map((t) => [t.value, t.label]));

const ACCEPT =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png';
const ACCEPTED_TYPES = ACCEPT.split(',');

/** PDFs and images open in the browser; Word files can only be downloaded. */
function canPreview(mime: string) {
  return mime === 'application/pdf' || mime.startsWith('image/');
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  return File;
}

interface TransactionDocumentsProps {
  transactionId: string;
  prefetchedDocuments?: Contract[];
  prefetchedSetupError?: string;
  documentsReady?: boolean;
}

export default function TransactionDocuments({
  transactionId,
  prefetchedDocuments = [],
  prefetchedSetupError = '',
  documentsReady = false,
}: TransactionDocumentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Contract[]>(prefetchedDocuments);
  const [loading, setLoading] = useState(!documentsReady);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState(prefetchedSetupError);
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState<string>('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Contract | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (!documentsReady) return;
    setDocuments(prefetchedDocuments);
    setSetupError(prefetchedSetupError);
    setLoading(false);
  }, [documentsReady, prefetchedDocuments, prefetchedSetupError]);

  const selectFile = (file: File | null) => {
    setSelectedFile(file);
    setError('');
    if (file && !title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PDF, Word, JPEG, or PNG files can be uploaded');
      return;
    }
    selectFile(file);
  };

  const fetchFileUrl = async (doc: Contract): Promise<string> => {
    const res = await fetch(`/api/transactions/${transactionId}/documents/${doc.id}`);
    const result = await res.json();
    if (!result.success || !result.data?.download_url) {
      throw new Error(result.error || 'Could not open file');
    }
    return result.data.download_url as string;
  };

  const handlePreview = async (doc: Contract) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewError('');
    try {
      setPreviewUrl(await fetchFileUrl(doc));
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Could not open file');
    }
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
    setPreviewError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Choose a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim() || selectedFile.name);
      formData.append('contract_type', contractType);

      const res = await fetch(`/api/transactions/${transactionId}/documents`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setDocuments((prev) => [result.data, ...prev]);
        setSelectedFile(null);
        setTitle('');
        setContractType('other');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Contract) => {
    setDownloadingId(doc.id);
    try {
      const url = await fetchFileUrl(doc);
      // Supabase signed URLs save as a file (instead of opening) with ?download
      const downloadUrl = `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(doc.file_name || doc.title)}`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: Contract) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    setError('');
    try {
      const res = await fetch(
        `/api/transactions/${transactionId}/documents/${doc.id}`,
        { method: 'DELETE' },
      );
      const result = await res.json();
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      } else {
        setError(result.error || 'Could not delete file');
      }
    } catch {
      setError('Could not delete file');
    } finally {
      setDeletingId(null);
    }
  };

  if (setupError) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
        <p className="font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Documents storage needs setup
        </p>
        <p className="mt-2 text-amber-800">{setupError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="rounded-[10px] border border-gray-150 bg-gray-50 p-5">
        <h3 className="text-[13.5px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 text-gray-700" />
          Upload document
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-[12.5px] text-gray-700 mb-1.5">File</label>
            <div
              className={`border-2 border-dashed rounded-[10px] p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-[var(--surface)]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-[13px] text-gray-700">
                  <FileText className="w-4 h-4 text-gray-700" />
                  <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-gray-600">({formatFileSize(selectedFile.size)})</span>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-600">
                    {isDragging ? 'Drop file to upload' : 'Drag a file here or click to choose PDF, Word, or image'}
                  </p>
                  <p className="text-[11.5px] text-gray-600 mt-1">Max 50MB</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Purchase Agreement"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <Select
            label="Document type"
            value={contractType}
            onChange={setContractType}
            triggerClassName="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            options={CONTRACT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-rose-600 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-4">
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            isLoading={uploading}
          >
            Upload document
          </Button>
        </div>
      </div>

      {/* List */}
      <div>
        <h3 className="text-[13.5px] font-semibold text-gray-900 mb-3">
          Documents ({documents.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 rounded-[10px] border border-dashed border-gray-200 bg-gray-50">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-[13px] text-gray-700">No documents yet</p>
            <p className="text-[11.5px] text-gray-600 mt-1">
              Upload contracts, disclosures, inspection reports, and more
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = fileIcon(doc.file_type);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-[10px] border border-gray-150 bg-[var(--surface)] hover:border-gray-300 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-700" strokeWidth={1.75} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    className="flex-1 min-w-0 text-left"
                    title="Quick view"
                  >
                    <p className="text-[13.5px] font-semibold text-gray-900 truncate hover:text-brand-600">{doc.title}</p>
                    <p className="text-[11.5px] text-gray-600 mt-0.5">
                      {TYPE_LABELS[doc.contract_type] || doc.contract_type}
                      {' · '}
                      {formatFileSize(doc.file_size)}
                      {' · '}
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="Quick view"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Download"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="p-2 rounded-lg text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewDoc && (
        <Modal isOpen onClose={closePreview} title={previewDoc.title} size="xl">
          <div className="space-y-4">
            {previewError ? (
              <p className="text-[13px] text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {previewError}
              </p>
            ) : !previewUrl ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : !canPreview(previewDoc.file_type) ? (
              <div className="text-center py-12 rounded-[10px] border border-dashed border-gray-200 bg-gray-50">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-[13px] text-gray-700">Word files can't be previewed here</p>
                <p className="text-[11.5px] text-gray-600 mt-1">Download it to open in Word or Google Docs</p>
              </div>
            ) : previewDoc.file_type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={previewDoc.title}
                className="mx-auto max-h-[70vh] w-auto rounded-lg"
              />
            ) : (
              <iframe
                src={previewUrl}
                title={previewDoc.title}
                className="w-full h-[70vh] rounded-lg border border-gray-200"
              />
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleDownload(previewDoc)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
