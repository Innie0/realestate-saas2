'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Search, Filter, Download, Trash2, Eye, Plus, Calendar, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { uploadContract, downloadContract, deleteContract } from '@/lib/contract-upload';
import type { Contract, ContractWithRelations } from '@/types';

const CONTRACT_TYPES = [
  { value: 'purchase_agreement', label: 'Purchase Agreement' },
  { value: 'listing_agreement', label: 'Listing Agreement' },
  { value: 'lease_agreement', label: 'Lease Agreement' },
  { value: 'offer', label: 'Offer to Purchase' },
  { value: 'counter_offer', label: 'Counter Offer' },
  { value: 'addendum', label: 'Addendum' },
  { value: 'disclosure', label: 'Disclosure Form' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'other', label: 'Other' },
];

const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'pending_signature', label: 'Pending Signature', color: 'yellow' },
  { value: 'signed', label: 'Signed', color: 'blue' },
  { value: 'executed', label: 'Executed', color: 'green' },
  { value: 'expired', label: 'Expired', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractWithRelations[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Contracts - Realestic';
  }, []);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list'); // New: view mode
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Fetch user ID
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    fetchUser();
  }, []);

  // Fetch contracts
  useEffect(() => {
    fetchContracts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = contracts;

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter(contract => contract.contract_type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter(contract => contract.status === filterStatus);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, filterType, filterStatus]);

  async function fetchContracts() {
    try {
      const response = await fetch('/api/contracts', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contractId: string) {
    if (!confirm('Are you sure you want to delete this contract?')) {
      return;
    }

    const result = await deleteContract(contractId);
    if (result.success) {
      setContracts(contracts.filter(c => c.id !== contractId));
    } else {
      alert(result.error || 'Failed to delete contract');
    }
  }

  async function handleDownload(contractId: string) {
    const result = await downloadContract(contractId);
    if (!result.success) {
      alert(result.error || 'Failed to download contract');
    }
  }

  function getStatusColor(status: string) {
    const statusObj = CONTRACT_STATUSES.find(s => s.value === status);
    return statusObj?.color || 'gray';
  }

  function getTypeLabel(type: string) {
    const typeObj = CONTRACT_TYPES.find(t => t.value === type);
    return typeObj?.label || type;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Group contracts by property address
  function groupContractsByProperty() {
    const grouped: Record<string, ContractWithRelations[]> = {};
    
    filteredContracts.forEach(contract => {
      // Get property address from contract, transaction, or use 'Ungrouped'
      const address = contract.property_address || 
                     contract.transaction?.property_address || 
                     'Ungrouped Contracts';
      
      if (!grouped[address]) {
        grouped[address] = [];
      }
      grouped[address].push(contract);
    });

    return grouped;
  }

  const groupedContracts = groupContractsByProperty();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contracts</h1>
        <p className="text-sm sm:text-base text-gray-400">Manage your contract documents</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Types</option>
            {CONTRACT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {CONTRACT_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 px-3 sm:px-4 py-2 text-sm rounded-l-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex-1 px-3 sm:px-4 py-2 text-sm rounded-r-lg transition-colors ${
              viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            By Property
          </button>
        </div>

        <Button onClick={() => setShowUploadModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Upload Contract
        </Button>
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No contracts found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterType || filterStatus
                ? 'Try adjusting your filters'
                : 'Upload your first contract to get started'}
            </p>
            {!searchTerm && !filterType && !filterStatus && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Contract
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="grid gap-4">
          {filteredContracts.map(contract => (
            <ContractCard 
              key={contract.id} 
              contract={contract}
              onDownload={handleDownload}
              onDelete={handleDelete}
              getStatusColor={getStatusColor}
              getTypeLabel={getTypeLabel}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      ) : (
        /* Grouped View */
        <div className="space-y-6">
          {Object.entries(groupedContracts).map(([address, contracts]) => (
            <div key={address} className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-700"></div>
                <h3 className="text-lg font-semibold text-white px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                  🏠 {address}
                  <span className="ml-3 text-sm font-normal text-gray-400">
                    ({contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'})
                  </span>
                </h3>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>
              <div className="grid gap-4">
                {contracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    getStatusColor={getStatusColor}
                    getTypeLabel={getTypeLabel}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadContractModal
          userId={userId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchContracts();
          }}
        />
      )}
    </div>
  );
}

// Upload Contract Modal Component
function UploadContractModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('other');
  const [contractDate, setContractDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!title) {
      setError('Please enter a title');
      return;
    }

    setUploading(true);

    const result = await uploadContract({
      file,
      userId,
      title,
      contractType,
      propertyAddress: propertyAddress || undefined,
      contractDate: contractDate || undefined,
      expirationDate: expirationDate || undefined,
      notes: notes || undefined,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Upload failed');
      setUploading(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Contract"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select File *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            Accepted: PDF, DOC, DOCX, JPG, PNG (max 50MB)
          </p>
        </div>

        <Input
          label="Contract Title *"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Purchase Agreement - 123 Main St"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contract Type
          </label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            {CONTRACT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contract Date"
            type="date"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
          />
          <Input
            label="Expiration Date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>

        <Input
          label="Property Address (for grouping)"
          type="text"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          placeholder="e.g., 123 Main St, City, State"
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Add any additional notes..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={uploading}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Contract Card Component
function ContractCard({
  contract,
  onDownload,
  onDelete,
  getStatusColor,
  getTypeLabel,
  formatFileSize,
}: {
  contract: any;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  getStatusColor: (status: string) => string;
  getTypeLabel: (type: string) => string;
  formatFileSize: (bytes: number) => string;
}) {
  const statusColor = getStatusColor(contract.status);
  const statusLabel = CONTRACT_STATUSES.find((s: any) => s.value === contract.status)?.label || contract.status;

  return (
    <Card className="hover:border-blue-500/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{contract.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              statusColor === 'green' ? 'bg-green-500/20 text-green-400' :
              statusColor === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
              statusColor === 'red' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {getTypeLabel(contract.contract_type)}
            </span>
            <span>{formatFileSize(contract.file_size)}</span>
            {contract.contract_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(contract.contract_date).toLocaleDateString()}
              </span>
            )}
            {contract.expiration_date && (
              <span className="text-yellow-400">
                Expires: {new Date(contract.expiration_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {contract.property_address && (
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                📍 {contract.property_address}
              </span>
            </div>
          )}

          {(contract.transaction || contract.client) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {contract.transaction && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                  📍 {contract.transaction.property_address}
                </span>
              )}
              {contract.client && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  👤 {contract.client.name}
                </span>
              )}
            </div>
          )}

          {contract.notes && (
            <p className="text-sm text-gray-400 line-clamp-2">{contract.notes}</p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onDownload(contract.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(contract.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
