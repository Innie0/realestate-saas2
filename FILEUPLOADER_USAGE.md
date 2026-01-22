# 📎 FileUploader Component Usage Guide

## Overview
A reusable file uploader component that handles file uploads to Supabase storage with progress tracking, previews, and file management.

---

## 🚀 Setup Instructions

### 1. **Run the Storage Setup SQL**
Open your Supabase SQL Editor and run:

```bash
supabase-storage-setup.sql
```

This will:
- Create the `uploads` storage bucket
- Set up RLS policies for secure file access
- Configure file size limits and allowed MIME types

### 2. **Install UUID Dependency**
```bash
npm install uuid
npm install --save-dev @types/uuid
```

---

## 📝 Basic Usage

### Import the Component
```tsx
import FileUploader, { UploadedFile } from '@/components/FileUploader';
```

### Simple Example
```tsx
'use client';

import { useState } from 'react';
import FileUploader, { UploadedFile } from '@/components/FileUploader';

export default function MyPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  return (
    <FileUploader
      category="listings"
      value={files}
      onChange={setFiles}
    />
  );
}
```

---

## 🎯 Common Use Cases

### 1. **Client Profile Pictures**
```tsx
<FileUploader
  category="clients"
  accept="image/png,image/jpeg,image/jpg"
  multiple={false}
  value={clientPhoto}
  onChange={setClientPhoto}
  uploadText="Upload Profile Photo"
/>
```

### 2. **Listing Photos (Multiple)**
```tsx
<FileUploader
  category="listings"
  accept="image/png,image/jpeg,image/jpg,image/webp"
  multiple={true}
  value={listingPhotos}
  onChange={setListingPhotos}
  uploadText="Upload Property Photos"
/>
```

### 3. **Company Logo**
```tsx
<FileUploader
  category="logos"
  accept="image/png,image/jpeg,image/svg+xml"
  multiple={false}
  value={logo}
  onChange={setLogo}
  uploadText="Upload Logo"
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

### 4. **Client Documents (PDFs)**
```tsx
<FileUploader
  category="clients"
  accept="application/pdf,image/png,image/jpeg"
  multiple={true}
  value={documents}
  onChange={setDocuments}
  uploadText="Upload Documents"
  showPreviews={true}
/>
```

---

## 🔧 Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `category` | `string` | `'general'` | Folder name for organizing files |
| `accept` | `string` | `'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp'` | Accepted MIME types |
| `maxSize` | `number` | `10485760` (10MB) | Maximum file size in bytes |
| `multiple` | `boolean` | `false` | Allow multiple file uploads |
| `value` | `UploadedFile[]` | `[]` | Currently uploaded files |
| `onChange` | `(files: UploadedFile[]) => void` | - | Callback when files change |
| `uploadText` | `string` | `'Upload Files'` | Custom upload button text |
| `showPreviews` | `boolean` | `true` | Show file previews |
| `disabled` | `boolean` | `false` | Disable uploader |

---

## 📊 UploadedFile Interface

```typescript
interface UploadedFile {
  url: string;      // Public URL for accessing the file
  path: string;     // Storage path (for deletion)
  name: string;     // Original filename
  size: number;     // File size in bytes
  type: string;     // MIME type (e.g., 'image/png')
}
```

---

## 🎨 Features

### ✅ Drag & Drop Support
Users can drag files directly onto the upload area.

### ✅ Progress Bar
Real-time upload progress indicator.

### ✅ Image Previews
Automatic thumbnails for uploaded images.

### ✅ File Validation
- File type validation
- File size validation
- Clear error messages

### ✅ File Management
- Remove files individually
- Visual hover effects
- Success indicators

### ✅ Security
- User-specific file storage
- RLS policies enforce access control
- Server-side validation

---

## 🗂️ File Organization

Files are automatically organized by user ID and category:

```
uploads/
├── {user_id}/
│   ├── listings/
│   │   ├── abc123.jpg
│   │   └── def456.png
│   ├── clients/
│   │   └── ghi789.pdf
│   ├── logos/
│   │   └── jkl012.svg
│   └── documents/
│       └── mno345.pdf
```

---

## 🔐 Security & Storage Policies

The storage bucket is configured with:
- **Public read access** (files are accessible via URL)
- **Authenticated upload** (must be logged in to upload)
- **User-scoped deletion** (can only delete own files)
- **File size limits** (10MB per file by default)
- **MIME type restrictions** (only allowed file types)

---

## 🛠️ Integration with Forms

### Using with Client Profile
```tsx
'use client';

import { useState } from 'react';
import FileUploader, { UploadedFile } from '@/components/FileUploader';

export default function ClientForm() {
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    photo: [] as UploadedFile[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: clientData.name,
      email: clientData.email,
      photo_url: clientData.photo[0]?.url || null,
    };

    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Name</label>
        <input
          value={clientData.name}
          onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
        />
      </div>

      <div>
        <label>Email</label>
        <input
          value={clientData.email}
          onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
        />
      </div>

      <div>
        <label>Profile Photo</label>
        <FileUploader
          category="clients"
          value={clientData.photo}
          onChange={(photo) => setClientData({ ...clientData, photo })}
          multiple={false}
        />
      </div>

      <button type="submit">Save Client</button>
    </form>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Upload a single image
- [ ] Upload multiple images
- [ ] Drag and drop files
- [ ] Remove an uploaded file
- [ ] Try uploading a file that's too large
- [ ] Try uploading an invalid file type
- [ ] Check file appears in Supabase Storage dashboard
- [ ] Verify file is accessible via public URL
- [ ] Test with different categories

---

## 🚨 Troubleshooting

### Upload fails with "Unauthorized"
- Make sure you're logged in
- Check middleware is running
- Verify RLS policies are set up

### Files not appearing in storage
- Check Supabase Storage dashboard
- Verify bucket name is "uploads"
- Run the storage setup SQL again

### "Invalid file type" error
- Check the `accept` prop matches your file type
- Update `allowedTypes` in `/api/upload/route.ts` if needed

### Image previews not showing
- Ensure file URL is accessible
- Check browser console for CORS errors
- Verify bucket is set to `public: true`

---

## 📚 Related Files

- Component: `components/FileUploader.tsx`
- API Route: `app/api/upload/route.ts`
- SQL Setup: `supabase-storage-setup.sql`
- Types: `types/index.ts`

---

**Happy uploading! 🎉**


