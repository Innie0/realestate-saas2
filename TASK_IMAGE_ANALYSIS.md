# Task Image Analysis Feature

## Overview
The Tasks page now supports image upload and AI-powered analysis using GPT-4 Vision. Real estate agents can upload images of contracts, documents, inspection reports, or any other visual content and get instant AI analysis.

## Features

### Image Upload
- **Supported formats**: PNG, JPG, JPEG, GIF, WEBP
- **Max file size**: 10MB
- **Preview**: Shows thumbnail before submission
- **Optional**: Can still create text-only tasks

### AI Analysis
- Uses **GPT-4 Vision** (gpt-4o model) for image understanding
- Combines image and text prompt for contextual analysis
- Provides detailed insights, extractions, and summaries

### Safety & Disclaimers
- **Financial advice protection**: AI is explicitly instructed to NEVER provide financial advice, investment recommendations, or guidance on financial decisions
- **Disclaimer shown**: Yellow warning message displayed on the input form
- **System prompt restrictions**: AI can extract and list financial figures but will not interpret or advise on them
- **Recommendation**: Users are reminded to consult licensed professionals for financial matters

## Use Cases

### 1. Contract Analysis
**Upload**: Purchase agreement, lease, listing contract  
**Prompt**: "Extract key dates, purchase price, and contingencies"  
**Output**: Structured list of important contract terms

### 2. Document Review
**Upload**: Inspection report, HOA documents  
**Prompt**: "What issues need immediate attention?"  
**Output**: Prioritized list of concerns

### 3. Contact Extraction
**Upload**: Business card photo  
**Prompt**: "Extract contact information"  
**Output**: Formatted contact details

### 4. General Document Help
**Upload**: Any real estate document  
**Prompt**: "Summarize this document"  
**Output**: Key points and overview

## Database Schema

### New Columns Added to `tasks` Table
```sql
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT FALSE;
```

Run the migration: `supabase-tasks-image-support.sql`

## API Updates

### POST `/api/tasks`
**New Request Body**:
```json
{
  "prompt": "Analyze this contract",
  "imageData": "data:image/png;base64,...",  // Optional base64 image
  "imageName": "contract.png"                // Optional filename
}
```

**Response includes**:
- `image_url`: Base64 image data
- `image_name`: Original filename
- `has_image`: Boolean flag

### GET `/api/tasks`
Returns all task fields including image data

## UI Components

### Upload Area
- Drag-and-drop style interface
- Image icon and instructions
- File size and format validation
- Preview thumbnail with remove button

### Task Display
- Purple "With Image" badge for tasks with images
- Image preview thumbnail in task history
- Full response with AI analysis

## Important Notes

### Financial Advice Protection
The system is designed with multiple layers to prevent financial advice:
1. **System prompt**: Explicit instructions against financial guidance
2. **User disclaimer**: Warning message on UI
3. **Behavioral guidance**: AI can list figures but not interpret
4. **Professional recommendation**: Directs users to licensed advisors

### Best Practices
- Use clear, specific prompts for better results
- Images should be clear and readable
- For multi-page documents, upload key pages
- Remember this is for informational purposes only

### Limitations
- Max 10MB file size
- Image quality affects AI accuracy
- Not a replacement for professional review
- Does not provide legal or financial advice

## Future Enhancements
- PDF support (convert to images)
- OCR for scanned documents
- Multi-image upload
- Template prompts for common use cases
- Export analysis results
