// Contract Upload Utility
// Handles uploading contract files to Supabase Storage

import { supabase } from './supabase';

export interface ContractUploadOptions {
  file: File;
  userId: string;
  title: string;
  contractType?: string;
  transactionId?: string;
  clientId?: string;
  contractDate?: string;
  expirationDate?: string;
  notes?: string;
  tags?: string[];
}

export interface ContractUploadResult {
  success: boolean;
  contract?: any;
  error?: string;
}

/**
 * Upload a contract file and create database record
 */
export async function uploadContract(
  options: ContractUploadOptions
): Promise<ContractUploadResult> {
  try {
    const { file, userId, title, contractType, transactionId, clientId, contractDate, expirationDate, notes, tags } = options;

    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' };
    }

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 50MB limit' };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('[Contract Upload] Uploading file:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Contract Upload] Storage upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    console.log('[Contract Upload] File uploaded successfully');

    // Create contract record in database
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        contract_type: contractType || 'other',
        status: 'draft',
        transaction_id: transactionId,
        client_id: clientId,
        contract_date: contractDate,
        expiration_date: expirationDate,
        notes,
        tags,
      }),
    });

    if (!response.ok) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from('contracts').remove([filePath]);
      
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to create contract record' };
    }

    const { contract } = await response.json();

    console.log('[Contract Upload] Contract created:', contract.id);

    return { success: true, contract };
  } catch (error: any) {
    console.error('[Contract Upload] Error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Delete a contract and its file
 */
export async function deleteContract(contractId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/contracts/${contractId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to delete contract' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Contract Delete] Error:', error);
    return { success: false, error: error.message || 'Delete failed' };
  }
}

/**
 * Download a contract file
 */
export async function downloadContract(contractId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(`/api/contracts/${contractId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to get download URL' };
    }

    const { url, file_name } = await response.json();

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, url };
  } catch (error: any) {
    console.error('[Contract Download] Error:', error);
    return { success: false, error: error.message || 'Download failed' };
  }
}
