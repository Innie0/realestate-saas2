'use client';

/**
 * FILE UPLOADER - EXAMPLE USAGE
 * 
 * This file demonstrates various ways to use the FileUploader component
 * Copy and paste these examples into your own components
 */

import { useState } from 'react';
import FileUploader, { UploadedFile } from '@/components/FileUploader';

// =====================================================
// EXAMPLE 1: Single Image Upload (Profile Photo)
// =====================================================
export function ProfilePhotoUploader() {
  const [profilePhoto, setProfilePhoto] = useState<UploadedFile[]>([]);

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-2">Profile Photo</h2>
      <FileUploader
        category="clients"
        accept="image/png,image/jpeg,image/jpg"
        multiple={false}
        value={profilePhoto}
        onChange={setProfilePhoto}
        uploadText="Upload Profile Photo"
      />
      
      {/* Show the uploaded URL */}
      {profilePhoto[0] && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Photo URL: <code className="text-xs">{profilePhoto[0].url}</code>
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// EXAMPLE 2: Multiple Property Photos
// =====================================================
export function PropertyPhotosUploader() {
  const [propertyPhotos, setPropertyPhotos] = useState<UploadedFile[]>([]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-2">Property Photos</h2>
      <FileUploader
        category="listings"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple={true}
        value={propertyPhotos}
        onChange={setPropertyPhotos}
        uploadText="Upload Property Photos"
      />

      {/* Show count */}
      <p className="mt-2 text-sm text-gray-600">
        {propertyPhotos.length} photo(s) uploaded
      </p>
    </div>
  );
}

// =====================================================
// EXAMPLE 3: Logo Upload (SVG Support)
// =====================================================
export function LogoUploader() {
  const [logo, setLogo] = useState<UploadedFile[]>([]);

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-2">Company Logo</h2>
      <FileUploader
        category="logos"
        accept="image/png,image/jpeg,image/svg+xml"
        multiple={false}
        value={logo}
        onChange={setLogo}
        uploadText="Upload Logo (PNG, JPG, or SVG)"
        maxSize={5 * 1024 * 1024} // 5MB limit
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 4: Documents Upload (PDFs + Images)
// =====================================================
export function DocumentsUploader() {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-2">Client Documents</h2>
      <FileUploader
        category="documents"
        accept="application/pdf,image/png,image/jpeg"
        multiple={true}
        value={documents}
        onChange={setDocuments}
        uploadText="Upload Documents (PDF or Images)"
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 5: Integration with Form
// =====================================================
export function ClientFormWithPhoto() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: [] as UploadedFile[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      photo_url: formData.photo[0]?.url || null, // Extract URL
    };

    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.success) {
      alert('Client created successfully!');
      // Reset form
      setFormData({ name: '', email: '', phone: '', photo: [] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold">Add New Client</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Profile Photo</label>
        <FileUploader
          category="clients"
          accept="image/png,image/jpeg,image/jpg"
          multiple={false}
          value={formData.photo}
          onChange={(photo) => setFormData({ ...formData, photo })}
          uploadText="Upload Photo"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create Client
      </button>
    </form>
  );
}

// =====================================================
// EXAMPLE 6: Disabled State
// =====================================================
export function DisabledUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-2">Conditional Upload</h2>
      
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={!isDisabled}
          onChange={() => setIsDisabled(!isDisabled)}
        />
        <span className="text-sm">Enable file upload</span>
      </label>

      <FileUploader
        category="temp"
        value={files}
        onChange={setFiles}
        disabled={isDisabled}
        uploadText={isDisabled ? 'Upload Disabled' : 'Upload Files'}
      />
    </div>
  );
}

// =====================================================
// EXAMPLE 7: Without Previews
// =====================================================
export function UploadWithoutPreviews() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold mb-2">Upload (No Previews)</h2>
      <FileUploader
        category="documents"
        value={files}
        onChange={setFiles}
        showPreviews={false} // Hide preview grid
      />

      {/* Custom file list */}
      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Uploaded Files:</p>
          <ul className="space-y-1">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =====================================================
// DEMO COMPONENT - Shows all examples
// =====================================================
export default function FileUploaderDemo() {
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-3xl font-bold">FileUploader Examples</h1>
      
      <ProfilePhotoUploader />
      <hr />
      
      <PropertyPhotosUploader />
      <hr />
      
      <LogoUploader />
      <hr />
      
      <DocumentsUploader />
      <hr />
      
      <ClientFormWithPhoto />
      <hr />
      
      <DisabledUploader />
      <hr />
      
      <UploadWithoutPreviews />
    </div>
  );
}


