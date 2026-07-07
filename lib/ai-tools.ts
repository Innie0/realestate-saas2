// @ts-nocheck
// AI Assistant tool registry — lets the chat assistant take real actions
// (create a project, add a client, schedule a reminder/event) instead of
// only drafting text. Each tool mirrors the validation/usage-limit logic of
// its equivalent REST route, but runs as a direct Supabase call since it
// executes inside the same authenticated request as the chat message.

import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';

/**
 * Tool definitions passed to OpenAI's `tools` param on chat.completions.create.
 */
export const assistantTools = [
  {
    type: 'function',
    function: {
      name: 'create_project',
      description:
        'Create a new listing project (draft) for a property. Use this when the agent asks you to create, start, or add a new listing/project.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project title, e.g. "123 Main St Listing"' },
          description: { type: 'string', description: 'Short description of the property' },
          property_type: {
            type: 'string',
            enum: ['house', 'apartment', 'condo', 'land', 'commercial'],
          },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip_code: { type: 'string' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          square_feet: { type: 'number' },
          price: { type: 'number', description: 'Listing price in USD' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description:
        'Add a new client to the agent\'s CRM. Use this when the agent asks you to add/create a client or contact.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_reminder',
      description:
        'Create a follow-up reminder for an existing client. Requires the client to already exist — use list_clients first if you are not sure of the exact name.',
      parameters: {
        type: 'object',
        properties: {
          client_name: { type: 'string', description: 'Name (or partial name) of the existing client' },
          title: { type: 'string', description: 'What the reminder is about' },
          reminder_date: {
            type: 'string',
            description: 'ISO 8601 date or datetime for when the reminder is due, e.g. 2026-07-10 or 2026-07-10T15:00:00',
          },
          description: { type: 'string' },
        },
        required: ['client_name', 'title', 'reminder_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description:
        'Create a calendar event (showing, open house, meeting, etc). Note: this does not sync to a connected Google Calendar automatically.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          start_time: { type: 'string', description: 'ISO 8601 datetime' },
          end_time: { type: 'string', description: 'ISO 8601 datetime' },
          location: { type: 'string' },
          description: { type: 'string' },
          event_type: {
            type: 'string',
            enum: ['showing', 'open_house', 'meeting', 'other'],
          },
        },
        required: ['title', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'Look up the agent\'s existing listing projects, optionally filtered by title.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Optional text to search for in the project title' },
          limit: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_clients',
      description: 'Look up the agent\'s existing CRM clients, optionally filtered by name/email/phone.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Optional text to search for in name, email, or phone' },
          limit: { type: 'number', description: 'Max results (default 5, max 10)' },
        },
      },
    },
  },
];

function clampLimit(value: unknown, fallback = 5, max = 10): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

async function createProjectTool(supabase, userId: string, args: Record<string, any>) {
  const title = typeof args.title === 'string' ? args.title.trim() : '';
  if (!title) {
    return { ok: false, error: 'A title is required to create a project.' };
  }

  const usage = await checkUsageLimit(supabase, userId, 'projects');
  if (!usage.allowed) {
    return { ok: false, error: usageLimitError('projects', usage.current, usage.limit, usage.plan) };
  }

  const property_info: Record<string, unknown> = {};
  if (args.address) property_info.address = String(args.address);
  if (args.city) property_info.city = String(args.city);
  if (args.state) property_info.state = String(args.state);
  if (args.zip_code) property_info.zip_code = String(args.zip_code);
  if (typeof args.bedrooms === 'number') property_info.bedrooms = args.bedrooms;
  if (typeof args.bathrooms === 'number') property_info.bathrooms = args.bathrooms;
  if (typeof args.square_feet === 'number') property_info.square_feet = args.square_feet;
  if (typeof args.price === 'number') property_info.price = args.price;

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title,
      description: args.description ? String(args.description) : null,
      property_type: args.property_type || null,
      property_info,
      images: [],
      status: 'draft',
    })
    .select('id, title, status')
    .single();

  if (error || !project) {
    return { ok: false, error: 'Failed to create the project. Please try again.' };
  }

  await incrementUsage(supabase, userId, 'projects');

  return {
    ok: true,
    message: `Created project "${project.title}" as a draft.`,
    project_id: project.id,
    dashboard_url: `/dashboard/projects/${project.id}`,
  };
}

async function createClientTool(supabase, userId: string, args: Record<string, any>) {
  const name = typeof args.name === 'string' ? args.name.trim() : '';
  if (!name) {
    return { ok: false, error: 'A name is required to add a client.' };
  }

  const usage = await checkUsageLimit(supabase, userId, 'clients');
  if (!usage.allowed) {
    return { ok: false, error: usageLimitError('clients', usage.current, usage.limit, usage.plan) };
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name,
      email: args.email ? String(args.email).trim() : null,
      phone: args.phone ? String(args.phone).trim() : null,
      status: 'active',
      source: 'manual',
      in_crm: true,
    })
    .select('id, name')
    .single();

  if (error || !client) {
    return { ok: false, error: 'Failed to add the client. Please try again.' };
  }

  await incrementUsage(supabase, userId, 'clients');

  return {
    ok: true,
    message: `Added ${client.name} to your CRM.`,
    client_id: client.id,
    dashboard_url: `/dashboard/clients`,
  };
}

async function findClientByName(supabase, userId: string, name: string) {
  const { data: matches } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('user_id', userId)
    .ilike('name', `%${name}%`)
    .limit(5);
  return matches || [];
}

async function createReminderTool(supabase, userId: string, args: Record<string, any>) {
  const title = typeof args.title === 'string' ? args.title.trim() : '';
  const reminderDateRaw = args.reminder_date;
  const clientName = typeof args.client_name === 'string' ? args.client_name.trim() : '';

  if (!title || !reminderDateRaw || !clientName) {
    return { ok: false, error: 'client_name, title, and reminder_date are all required.' };
  }

  const reminderDate = new Date(reminderDateRaw);
  if (Number.isNaN(reminderDate.getTime())) {
    return { ok: false, error: `Could not understand the date "${reminderDateRaw}". Use an ISO date like 2026-07-10.` };
  }

  const matches = await findClientByName(supabase, userId, clientName);
  if (matches.length === 0) {
    return { ok: false, error: `No client found matching "${clientName}". Add them as a client first, or check the spelling.` };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: `Multiple clients match "${clientName}". Ask the agent which one they mean.`,
      matches: matches.map((c) => ({ name: c.name, email: c.email })),
    };
  }

  const client = matches[0];

  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({
      client_id: client.id,
      user_id: userId,
      title,
      description: args.description ? String(args.description).trim() : null,
      reminder_date: reminderDate.toISOString(),
      is_completed: false,
    })
    .select('id, title, reminder_date')
    .single();

  if (error || !reminder) {
    return { ok: false, error: 'Failed to create the reminder. Please try again.' };
  }

  return {
    ok: true,
    message: `Created a reminder "${reminder.title}" for ${client.name} on ${new Date(reminder.reminder_date).toLocaleDateString()}.`,
    reminder_id: reminder.id,
    dashboard_url: `/dashboard/clients`,
  };
}

async function createCalendarEventTool(supabase, userId: string, args: Record<string, any>) {
  const title = typeof args.title === 'string' ? args.title.trim() : '';
  const startRaw = args.start_time;
  const endRaw = args.end_time;

  if (!title || !startRaw || !endRaw) {
    return { ok: false, error: 'title, start_time, and end_time are all required.' };
  }

  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: 'start_time and end_time must be valid ISO datetimes.' };
  }

  const usage = await checkUsageLimit(supabase, userId, 'calendar_events');
  if (!usage.allowed) {
    return { ok: false, error: usageLimitError('calendar_events', usage.current, usage.limit, usage.plan) };
  }

  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      title,
      description: args.description ? String(args.description) : null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: args.location ? String(args.location) : null,
      event_type: args.event_type || 'other',
    })
    .select('id, title, start_time')
    .single();

  if (error || !event) {
    return { ok: false, error: 'Failed to create the calendar event. Please try again.' };
  }

  await incrementUsage(supabase, userId, 'calendar_events');

  return {
    ok: true,
    message: `Added "${event.title}" to your calendar on ${new Date(event.start_time).toLocaleString()}. Note: this does not sync automatically to Google Calendar — use the Sync button on the Calendar page for that.`,
    event_id: event.id,
    dashboard_url: `/dashboard/calendar`,
  };
}

async function listProjectsTool(supabase, userId: string, args: Record<string, any>) {
  const limit = clampLimit(args.limit);
  let query = supabase
    .from('projects')
    .select('id, title, status, property_info, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (args.search) {
    query = query.ilike('title', `%${args.search}%`);
  }

  const { data: projects, error } = await query;
  if (error) {
    return { ok: false, error: 'Failed to look up projects.' };
  }

  return {
    ok: true,
    projects: (projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      address: p.property_info?.address || null,
    })),
  };
}

async function listClientsTool(supabase, userId: string, args: Record<string, any>) {
  const limit = clampLimit(args.limit);
  let query = supabase
    .from('clients')
    .select('id, name, email, phone, status')
    .eq('user_id', userId)
    .eq('in_crm', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (args.search) {
    query = query.or(`name.ilike.%${args.search}%,email.ilike.%${args.search}%,phone.ilike.%${args.search}%`);
  }

  const { data: clients, error } = await query;
  if (error) {
    return { ok: false, error: 'Failed to look up clients.' };
  }

  return {
    ok: true,
    clients: (clients || []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.status,
    })),
  };
}

const TOOL_EXECUTORS: Record<string, (supabase: any, userId: string, args: Record<string, any>) => Promise<Record<string, any>>> = {
  create_project: createProjectTool,
  create_client: createClientTool,
  create_reminder: createReminderTool,
  create_calendar_event: createCalendarEventTool,
  list_projects: listProjectsTool,
  list_clients: listClientsTool,
};

/**
 * Execute a single tool call by name. Never throws — always returns a plain
 * object suitable for JSON.stringify() into a `role: 'tool'` message.
 */
export async function executeAssistantTool(
  supabase,
  userId: string,
  name: string,
  rawArgs: string
): Promise<Record<string, any>> {
  let args: Record<string, any> = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return { ok: false, error: 'Could not parse tool arguments.' };
  }

  const executor = TOOL_EXECUTORS[name];
  if (!executor) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }

  try {
    return await executor(supabase, userId, args);
  } catch (err) {
    console.error(`AI tool "${name}" error:`, err);
    return { ok: false, error: 'Something went wrong running that action. Please try again.' };
  }
}

export const ASSISTANT_TOOLS_SYSTEM_NOTE = `
You also have tools available to take real actions in the agent's account: create_project, create_client, create_reminder, create_calendar_event, list_projects, list_clients.

Rules for using tools:
- If the agent asks you to actually create/add/schedule something (a project, client, reminder, or calendar event), you MUST call the matching tool. Simply describing what you would create is not enough — nothing is saved unless you call the tool.
- If you're just drafting content (an email, listing description, social caption) without being asked to save/create a record, do not call a tool — just write the text.
- Use list_projects or list_clients first if you need to find an existing record's exact name before acting on it (e.g. before creating a reminder for a client).
- If a tool call fails or returns an error, explain the error to the agent in plain language. Do not retry the same call with the same arguments.
- After a tool succeeds, confirm what you did in plain language (e.g. "Created a draft project for 123 Main St — you can find it in Projects.").
`;
