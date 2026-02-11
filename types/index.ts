// Type definitions for the entire application
// These types help TypeScript understand our data structures

/**
 * User type - represents a registered user in the system
 */
export interface User {
  id: string; // Unique identifier from Supabase
  email: string; // User's email address
  full_name?: string; // Optional full name
  avatar_url?: string; // Optional profile picture URL
  created_at: string; // When the user account was created
  updated_at: string; // When the user account was last updated
}

/**
 * Project type - represents a real estate project
 */
export interface Project {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this project
  title: string; // Project title (e.g., "123 Main St Listing")
  description?: string; // Optional project description
  property_type?: 'house' | 'apartment' | 'condo' | 'land' | 'commercial'; // Type of property
  property_info?: PropertyInfo; // Detailed property information
  images: (string | ProjectImage)[]; // Array of image URLs or image objects (supports both formats)
  ai_content?: AIGeneratedContent; // AI-generated marketing content
  status: 'draft' | 'in_progress' | 'completed'; // Project status
  created_at: string; // When the project was created
  updated_at: string; // When the project was last updated
}

/**
 * PropertyInfo type - detailed information about a property
 */
export interface PropertyInfo {
  address?: string; // Street address
  city?: string; // City
  state?: string; // State/Province
  zip_code?: string; // ZIP/Postal code
  bedrooms?: number; // Number of bedrooms
  bathrooms?: number; // Number of bathrooms
  square_feet?: number; // Total square footage
  lot_size?: number; // Lot size in acres or sq ft
  year_built?: number; // Year the property was built
  price?: number; // Listing price
  features?: string[]; // Special features (e.g., "pool", "garage")
}

/**
 * ProjectImage type - represents an uploaded image for a project
 */
export interface ProjectImage {
  id: string; // Unique identifier
  project_id: string; // ID of the parent project
  url: string; // Image URL (from storage)
  thumbnail_url?: string; // Optional thumbnail version
  caption?: string; // Optional image caption
  order: number; // Display order (for sorting)
  created_at: string; // When the image was uploaded
}

/**
 * AIGeneratedContent type - AI-generated marketing content
 */
export interface AIGeneratedContent {
  headline?: string; // Catchy headline for the listing
  description?: string; // Full property description (currently selected tone)
  key_features?: string[]; // Bullet points of key features
  social_media_posts?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  // Direct social media fields (for easier access)
  instagram?: string; // Instagram caption
  facebook?: string; // Facebook post
  email_template?: string; // Email marketing template
  generated_at?: string; // When the content was generated
  selected_tone?: 'professional' | 'casual' | 'luxury'; // Currently selected tone
  // Stored tone versions with their social media captions
  tone_versions?: {
    professional?: {
      description: string;
      instagram: string;
      facebook: string;
    };
    casual?: {
      description: string;
      instagram: string;
      facebook: string;
    };
    luxury?: {
      description: string;
      instagram: string;
      facebook: string;
    };
  };
}

/**
 * BrandKit type - user's branding preferences
 */
export interface BrandKit {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this brand kit
  logo_url?: string; // Logo image URL
  primary_color: string; // Primary brand color (hex code)
  secondary_color?: string; // Secondary brand color (hex code)
  accent_color?: string; // Accent color (hex code)
  font_family: string; // Font family name (e.g., "Inter", "Roboto")
  font_style?: 'normal' | 'italic'; // Font style
  font_weight?: number; // Font weight (e.g., 400, 600, 700)
  created_at: string; // When the brand kit was created
  updated_at: string; // When the brand kit was last updated
}

/**
 * CalendarEvent type - represents a calendar event
 */
export interface CalendarEvent {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this event
  title: string; // Event title (e.g., "Property Showing - 123 Main St")
  description?: string; // Event description
  start_time: string; // Start date/time (ISO 8601 format)
  end_time: string; // End date/time (ISO 8601 format)
  location?: string; // Event location
  project_id?: string; // Optional link to a project
  event_type: 'showing' | 'open_house' | 'meeting' | 'other'; // Type of event
  attendees?: string[]; // Email addresses of attendees
  google_event_id?: string; // Google Calendar event ID (if synced)
  outlook_event_id?: string; // Outlook event ID (if synced)
  created_at: string; // When the event was created
  updated_at: string; // When the event was last updated
}

/**
 * CalendarConnection type - represents a connected calendar
 */
export interface CalendarConnection {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this connection
  provider: 'google' | 'outlook'; // Calendar provider
  email: string; // Connected email address
  access_token: string; // OAuth access token (encrypted)
  refresh_token?: string; // OAuth refresh token (encrypted)
  token_expiry?: string; // When the access token expires
  is_active: boolean; // Whether the connection is active
  created_at: string; // When the connection was created
  updated_at: string; // When the connection was last updated
}

/**
 * Client type - represents a CRM client
 */
export interface Client {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this client
  name: string; // Client's full name
  email?: string; // Client's email address
  phone?: string; // Client's phone number
  status: 'active' | 'inactive' | 'archived'; // Client status
  created_at: string; // When the client was created
  updated_at: string; // When the client was last updated
}

/**
 * ClientNote type - represents a note for a client
 */
export interface ClientNote {
  id: string; // Unique identifier
  client_id: string; // ID of the client this note belongs to
  user_id: string; // ID of the user who created this note
  note: string; // Note content
  created_at: string; // When the note was created
  updated_at: string; // When the note was last updated
}

/**
 * Reminder type - represents a follow-up reminder
 */
export interface Reminder {
  id: string; // Unique identifier
  client_id: string; // ID of the client this reminder is for
  user_id: string; // ID of the user who created this reminder
  title: string; // Reminder title
  description?: string; // Optional reminder description
  reminder_date: string; // When to be reminded (ISO 8601 format)
  is_completed: boolean; // Whether the reminder has been completed
  completed_at?: string; // When the reminder was completed
  created_at: string; // When the reminder was created
  updated_at: string; // When the reminder was last updated
}

/**
 * ClientWithDetails type - client with associated notes and reminders
 */
export interface ClientWithDetails extends Client {
  notes?: ClientNote[]; // Associated notes
  reminders?: Reminder[]; // Associated reminders
  upcoming_reminders_count?: number; // Count of upcoming reminders
}

/**
 * UploadedFile type - represents an uploaded file
 */
export interface UploadedFile {
  url: string; // Public URL for accessing the file
  path: string; // Storage path (for deletion)
  name: string; // Original filename
  size: number; // File size in bytes
  type: string; // MIME type (e.g., 'image/png')
}

/**
 * APIResponse type - standard API response format
 */
export interface APIResponse<T = any> {
  success: boolean; // Whether the request was successful
  data?: T; // Response data (if successful)
  error?: string; // Error message (if failed)
  message?: string; // Additional message
}

/**
 * Transaction type - represents a real estate transaction
 */
export interface Transaction {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this transaction
  
  // Property Information
  property_address: string; // Full street address
  property_city?: string; // City
  property_state?: string; // State
  property_zip?: string; // ZIP code
  property_type?: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  
  // Buyer Information
  buyer_name: string; // Buyer's full name
  buyer_email?: string; // Buyer's email
  buyer_phone?: string; // Buyer's phone
  buyer_agent_name?: string; // Buyer's agent name
  buyer_agent_email?: string; // Buyer's agent email
  buyer_agent_phone?: string; // Buyer's agent phone
  
  // Seller Information
  seller_name: string; // Seller's full name
  seller_email?: string; // Seller's email
  seller_phone?: string; // Seller's phone
  seller_agent_name?: string; // Seller's agent name
  seller_agent_email?: string; // Seller's agent email
  seller_agent_phone?: string; // Seller's agent phone
  
  // Financial Information
  offer_price: number; // Offer/purchase price
  earnest_money?: number; // Earnest money deposit
  down_payment?: number; // Down payment amount
  loan_amount?: number; // Loan amount
  
  // Key Terms
  terms?: TransactionTerms; // Additional terms
  notes?: string; // General notes
  
  // Important Dates
  offer_date?: string; // Date offer was made
  acceptance_date?: string; // Date offer was accepted
  inspection_date?: string; // Scheduled inspection date
  inspection_deadline?: string; // Inspection contingency deadline
  appraisal_date?: string; // Scheduled appraisal date
  appraisal_deadline?: string; // Appraisal contingency deadline
  financing_deadline?: string; // Financing contingency deadline
  title_deadline?: string; // Title contingency deadline
  closing_date?: string; // Scheduled closing date
  possession_date?: string; // Possession/move-in date
  
  // Status
  status: 'active' | 'pending' | 'under_contract' | 'closed' | 'cancelled' | 'expired';
  
  // Links
  project_id?: string; // Link to a project
  client_id?: string; // Link to a client
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data (when joined)
  checklist_items?: TransactionChecklistItem[];
  reminders?: TransactionReminder[];
}

/**
 * TransactionTerms type - flexible storage for additional transaction terms
 */
export interface TransactionTerms {
  contingencies?: string[]; // List of contingencies
  inclusions?: string[]; // Items included in sale
  exclusions?: string[]; // Items excluded from sale
  special_provisions?: string; // Special provisions text
  home_warranty?: boolean; // Home warranty included
  home_warranty_amount?: number; // Home warranty amount
  closing_cost_credit?: number; // Seller closing cost credit
  other?: Record<string, any>; // Other flexible terms
}

/**
 * TransactionChecklistItem type - checklist item for a transaction
 */
export interface TransactionChecklistItem {
  id: string; // Unique identifier
  transaction_id: string; // Parent transaction ID
  user_id: string; // Owner user ID
  
  title: string; // Item title
  description?: string; // Item description
  category: 'inspection' | 'appraisal' | 'financing' | 'title' | 'closing' | 'other';
  due_date?: string; // Due date
  is_completed: boolean; // Completion status
  completed_at?: string; // When completed
  order_index: number; // Sort order
  
  created_at: string;
  updated_at: string;
}

/**
 * TransactionReminder type - automated reminder for transaction milestones
 */
export interface TransactionReminder {
  id: string; // Unique identifier
  transaction_id: string; // Parent transaction ID
  user_id: string; // Owner user ID
  
  title: string; // Reminder title
  description?: string; // Reminder description
  reminder_date: string; // When to remind
  reminder_type: 'inspection' | 'appraisal' | 'financing' | 'closing' | 'custom';
  days_before?: number; // Days before milestone
  
  is_sent: boolean; // Whether reminder was sent
  sent_at?: string; // When sent
  is_dismissed: boolean; // Whether user dismissed it
  
  created_at: string;
  updated_at: string;
}

/**
 * TransactionWithDetails type - transaction with all related data
 */
export interface TransactionWithDetails extends Transaction {
  checklist_items: TransactionChecklistItem[];
  reminders: TransactionReminder[];
  completed_items_count?: number;
  total_items_count?: number;
  days_to_closing?: number;
}

/**
 * TransactionTimelineEvent type - for timeline display
 */
export interface TransactionTimelineEvent {
  id: string;
  date: string;
  title: string;
  type: 'offer' | 'acceptance' | 'inspection' | 'appraisal' | 'financing' | 'title' | 'closing' | 'possession';
  status: 'completed' | 'upcoming' | 'overdue' | 'today';
  description?: string;
}

/**
 * Contract type - represents a contract document
 */
export interface Contract {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this contract
  transaction_id?: string; // Optional link to a transaction
  client_id?: string; // Optional link to a client
  
  // File information
  title: string; // Contract title
  file_name: string; // Original filename
  file_path: string; // Storage path
  file_size: number; // File size in bytes
  file_type: string; // MIME type
  
  // Contract details
  contract_type: 'purchase_agreement' | 'listing_agreement' | 'lease_agreement' | 'offer' | 'counter_offer' | 'addendum' | 'disclosure' | 'inspection' | 'other';
  status: 'draft' | 'pending_signature' | 'signed' | 'executed' | 'expired' | 'cancelled';
  property_address?: string; // Property address for grouping
  
  // Important dates
  contract_date?: string; // Contract date
  expiration_date?: string; // Expiration date
  signed_date?: string; // Date signed
  
  // Metadata
  notes?: string; // Additional notes
  tags?: string[]; // Tags for organization
  
  created_at: string;
  updated_at: string;
}

/**
 * ContractWithRelations type - contract with related transaction/client data
 */
export interface ContractWithRelations extends Contract {
  transaction?: Transaction;
  client?: Client;
}

/**
 * Conversation type - represents a chat conversation with AI
 */
export interface Conversation {
  id: string; // Unique identifier
  user_id: string; // ID of the user who owns this conversation
  title: string | null; // Auto-generated title from first message
  created_at: string; // When the conversation was created
  updated_at: string; // When the conversation was last updated
}

/**
 * ConversationMessage type - represents a single message in a conversation
 */
export interface ConversationMessage {
  id: string; // Unique identifier
  conversation_id: string; // Parent conversation ID
  user_id: string; // Owner user ID
  role: 'user' | 'assistant' | 'system'; // Message role
  content: string; // Message content
  image_url?: string | null; // Optional image attachment (for user messages)
  image_name?: string | null; // Original filename of uploaded image
  created_at: string; // When the message was created
}

/**
 * ConversationWithMessages type - conversation with all messages
 */
export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

