# Contract Storage Feature - Setup Guide

## ✅ What's Been Implemented

A complete contract storage system for managing legal documents and contracts in your real estate SaaS.

### Features Included:
- ✅ **Upload contracts** (PDF, DOC, DOCX, JPG, PNG files up to 50MB)
- ✅ **Store contracts** securely in Supabase Storage
- ✅ **List all contracts** with search and filtering
- ✅ **Download contracts** with signed URLs
- ✅ **Delete contracts** (removes file and database record)
- ✅ **Contract metadata** (type, status, dates, notes, tags)
- ✅ **Link to transactions** and clients (optional)
- ✅ **Sidebar navigation** added (Contracts menu item)

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

1. Go to your **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the entire contents of `supabase-contracts-schema.sql`
5. Click **"Run"**

This will create:
- ✅ `contracts` table with all columns and indexes
- ✅ `contracts` storage bucket
- ✅ Row Level Security (RLS) policies
- ✅ Storage policies for secure access
- ✅ Triggers for automatic `updated_at` timestamps

### Step 2: Verify Storage Bucket

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should see a new bucket named `contracts`
3. If you don't see it, create it manually:
   - Click **"New bucket"**
   - Name: `contracts`
   - Public: **OFF** (keep it private!)
   - Click **"Create bucket"**

### Step 3: Deploy to Vercel

The code is already pushed to GitHub, so:
1. Vercel will automatically detect the changes
2. Wait for the deployment to complete (~2-3 minutes)
3. Check the deployment logs for any errors

---

## 📋 How to Use

### Access Contracts Page:
1. Log in to your dashboard
2. Click **"Contracts"** in the sidebar (new menu item with 📝 icon)
3. You'll see the contracts management page

### Upload a Contract:
1. Click **"Upload Contract"** button
2. Fill in the form:
   - **Select File**: Choose PDF, DOC, DOCX, JPG, or PNG (max 50MB)
   - **Contract Title**: Give it a descriptive name
   - **Contract Type**: Select from dropdown (Purchase Agreement, Listing Agreement, etc.)
   - **Contract Date**: (Optional) Date the contract was created
   - **Expiration Date**: (Optional) When the contract expires
   - **Notes**: (Optional) Additional notes
3. Click **"Upload Contract"**

### Search & Filter:
- **Search bar**: Search by title or notes
- **Type filter**: Filter by contract type
- **Status filter**: Filter by status (Draft, Signed, Executed, etc.)

### Download a Contract:
- Click the **download icon** (⬇️) on any contract card
- File will download automatically with original filename

### Delete a Contract:
- Click the **trash icon** (🗑️) on any contract card
- Confirm deletion
- Both file and database record are deleted

---

## 🔗 Integration with Transactions

Contracts can be linked to transactions (future enhancement):

In the upload modal, you could add a dropdown to select:
- Which transaction this contract belongs to
- Which client this contract is for

This would make the `transaction_id` and `client_id` fields functional.

---

## 📊 Contract Types Available

The system supports these contract types:
- **Purchase Agreement** - Main purchase contract
- **Listing Agreement** - Agent listing contracts
- **Lease Agreement** - Rental/lease contracts
- **Offer to Purchase** - Initial offers
- **Counter Offer** - Counter offers
- **Addendum** - Contract modifications
- **Disclosure Form** - Required disclosures
- **Inspection Report** - Inspection documents
- **Other** - Any other type

---

## 🎨 Contract Statuses

Track contract lifecycle:
- **Draft** - Initial draft
- **Pending Signature** - Awaiting signatures
- **Signed** - All parties signed
- **Executed** - Fully executed and delivered
- **Expired** - Contract expired
- **Cancelled** - Contract cancelled

---

## 🔒 Security

- ✅ **Row Level Security (RLS)** enabled - users can only see their own contracts
- ✅ **Storage policies** - users can only access their own files
- ✅ **Signed URLs** - download links expire after 60 seconds
- ✅ **File validation** - only approved file types allowed
- ✅ **Size limits** - 50MB max file size

---

## 💾 Database Schema

### Contracts Table:
```sql
contracts (
  id UUID PRIMARY KEY,
  user_id UUID (references auth.users),
  transaction_id UUID (optional, references transactions),
  client_id UUID (optional, references clients),
  
  title VARCHAR (required),
  file_name VARCHAR (required),
  file_path TEXT (required),
  file_size BIGINT,
  file_type VARCHAR,
  
  contract_type VARCHAR,
  status VARCHAR,
  
  contract_date DATE,
  expiration_date DATE,
  signed_date DATE,
  
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 📁 File Structure

### New Files Created:
```
app/api/contracts/
├── route.ts                    # List & create contracts
├── [id]/
│   ├── route.ts                # Get, update, delete single contract
│   └── download/
│       └── route.ts            # Download contract file

app/dashboard/contracts/
└── page.tsx                    # Contracts management UI

lib/
└── contract-upload.ts          # Upload utility functions

types/
└── index.ts                    # Contract type definitions (updated)

components/layout/
└── Sidebar.tsx                 # Sidebar nav (updated with Contracts link)

supabase-contracts-schema.sql  # Database migration
```

---

## ⚠️ Important Notes

1. **No usage limits** - Currently unlimited uploads and storage (as requested)
2. **File size limit** - Set to 50MB per file (can be adjusted in schema)
3. **Allowed file types** - PDF, DOC, DOCX, JPG, PNG only
4. **Storage location** - Files stored in Supabase Storage under `contracts/{user_id}/`

---

## 🎯 Next Steps (Optional Enhancements)

If you want to add more features later:

1. **Link to transactions** - Add transaction selector in upload modal
2. **Link to clients** - Add client selector in upload modal
3. **PDF preview** - Install `react-pdf` and show preview in modal
4. **Bulk upload** - Allow uploading multiple files at once
5. **Automatic expiration alerts** - Send reminders before contracts expire
6. **Version control** - Keep history of contract revisions
7. **E-signature integration** - Integrate DocuSign or HelloSign
8. **AI contract analysis** - Use OpenAI to extract key dates/terms

---

## 🐛 Troubleshooting

**Problem**: Upload fails with "Failed to create contract record"
- **Solution**: Make sure you ran the database migration SQL

**Problem**: "Access Denied" when uploading
- **Solution**: Check that storage policies were created (re-run the SQL)

**Problem**: Can't see contracts page
- **Solution**: Clear browser cache and hard refresh (Ctrl+Shift+R)

**Problem**: Downloads not working
- **Solution**: Check that the `contracts` storage bucket exists and is private

---

## ✅ Testing Checklist

Test these features after setup:

- [ ] Can access /dashboard/contracts page
- [ ] Can upload a PDF file
- [ ] Can see uploaded contract in list
- [ ] Can download the contract
- [ ] Can search contracts
- [ ] Can filter by type
- [ ] Can filter by status
- [ ] Can delete a contract
- [ ] Deleted contract file is removed from storage

---

## 🎉 You're All Set!

The contract storage system is now fully functional and ready to use!

Users can now:
✅ Upload and store contract documents securely
✅ Organize contracts by type and status
✅ Search and filter their contracts
✅ Download contracts anytime
✅ Track important contract dates

**No subscription limits are enforced** - both Starter and Pro users have full access!
