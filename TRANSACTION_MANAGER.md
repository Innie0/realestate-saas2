# Transaction Manager Feature

## Overview

The Transaction Manager is a comprehensive feature for tracking real estate transactions from offer to closing. It includes:

- **Transaction tracking** with buyer/seller info, offer price, and key terms
- **Timeline visualization** showing all important dates
- **Auto-generated checklist** for each transaction phase
- **Automated reminders** via cron-like scheduler
- **Progress tracking** with completion percentages

## Setup

### 1. Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Run this file:
supabase-transactions-schema.sql
```

This creates:
- `transactions` table
- `transaction_checklist_items` table
- `transaction_reminders` table
- Auto-generation triggers for checklist and reminders

### 2. Environment Variables

No additional environment variables are required. The feature uses your existing Supabase configuration.

### 3. Cron Job (Optional)

For production reminder notifications, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

This runs every 4 hours to process pending reminders.

## Features

### Creating a Transaction

1. Navigate to **Dashboard → Transactions**
2. Click **"New Transaction"**
3. Fill in the form across 4 sections:
   - **Property**: Address, city, state, type
   - **Buyer & Seller**: Contact info for all parties
   - **Financial**: Price, earnest money, down payment
   - **Important Dates**: Inspection, appraisal, financing, closing

### Auto-Generated Content

When you create a transaction with dates, the system automatically generates:

#### Checklist Items
- Inspection tasks (schedule, review report, negotiate repairs)
- Appraisal tasks (order, review)
- Financing tasks (application, documents, approval)
- Title tasks (search, review, clear issues)
- Closing tasks (walkthrough, documents, wire funds, attend)

#### Reminders
- 3 days before inspection deadline
- 1 day before inspection deadline
- 3 days before appraisal deadline
- 1 day before appraisal deadline
- 3 days before financing deadline
- 1 day before financing deadline
- 7 days before closing
- 3 days before closing
- 1 day before closing

### Timeline View

The timeline shows:
- All transaction milestones in chronological order
- Color-coded status (completed, today, upcoming)
- Days remaining until each event
- Visual progress through the transaction

### Checklist Management

- View tasks grouped by category (inspection, appraisal, etc.)
- Mark tasks as complete/incomplete
- Add custom tasks
- Track overall completion percentage
- Due dates for each task

### Reminders System

- Automatic reminders based on key dates
- Dismiss reminders when acknowledged
- View all upcoming reminders
- Custom reminder creation

## API Endpoints

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/[id]` - Get transaction details
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Checklist
- `POST /api/transactions/[id]/checklist` - Add checklist item
- `PUT /api/transactions/[id]/checklist` - Update checklist item
- `DELETE /api/transactions/[id]/checklist?item_id=xxx` - Delete item

### Reminders
- `GET /api/transactions/reminders` - Get reminders
- `POST /api/transactions/reminders` - Create custom reminder
- `PUT /api/transactions/reminders` - Update reminder
- `DELETE /api/transactions/reminders?reminder_id=xxx` - Delete reminder

### Cron
- `GET /api/cron/reminders` - Process pending reminders

## Status Options

- `active` - New/active transaction
- `pending` - Waiting for response
- `under_contract` - Contract signed
- `closed` - Transaction completed
- `cancelled` - Transaction cancelled
- `expired` - Offer expired

## UI Components

### TransactionForm
Multi-step form with tab navigation for creating/editing transactions.

### TransactionTimeline
Visual timeline showing all milestones with status indicators.

### TransactionChecklist
Interactive checklist with category grouping and progress tracking.

## File Structure

```
app/
├── api/
│   ├── transactions/
│   │   ├── route.ts              # List & Create
│   │   ├── [id]/
│   │   │   ├── route.ts          # Get, Update, Delete
│   │   │   └── checklist/
│   │   │       └── route.ts      # Checklist CRUD
│   │   └── reminders/
│   │       └── route.ts          # Reminders CRUD
│   └── cron/
│       └── reminders/
│           └── route.ts          # Cron processor
├── dashboard/
│   └── transactions/
│       ├── page.tsx              # List page
│       ├── new/
│       │   └── page.tsx          # Create page
│       └── [id]/
│           └── page.tsx          # Detail page
components/
├── TransactionForm.tsx           # Create/Edit form
├── TransactionTimeline.tsx       # Timeline display
└── TransactionChecklist.tsx      # Checklist component
lib/
└── reminder-scheduler.ts         # Client-side scheduler
types/
└── index.ts                      # Transaction types
```

## Best Practices

1. **Always set key dates** - This enables auto-generation of checklist and reminders
2. **Review checklist immediately** - Customize for your specific transaction
3. **Monitor reminders** - Don't dismiss until you've taken action
4. **Update status regularly** - Keep transaction status current
5. **Add notes** - Document important details and decisions
