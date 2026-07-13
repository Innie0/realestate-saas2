// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { SearchResponse, SearchResult } from '@/lib/search/types';

const LIMIT = 5;

function ilike(q: string): string {
  return `%${q.replace(/[%_\\]/g, '\\$&')}%`;
}

function projectLabel(project: { title?: string; property_info?: { address?: string; city?: string; state?: string } | null }) {
  const info = project.property_info;
  if (info?.address?.trim()) {
    return [info.address, info.city, info.state].filter(Boolean).join(', ');
  }
  return project.title || 'Untitled project';
}

/**
 * GET /api/search?q=
 * Unified dashboard search across projects, clients, transactions, ads, calendar, and AI chats.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          projects: [],
          clients: [],
          leads: [],
          transactions: [],
          ads: [],
          events: [],
          conversations: [],
        } satisfies SearchResponse,
      });
    }

    const pattern = ilike(q);

    const [
      projectsRes,
      crmClientsRes,
      inboxClientsRes,
      transactionsRes,
      adsRes,
      eventsRes,
      conversationsRes,
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('id, title, description, status, property_info')
        .eq('user_id', user.id)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('updated_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('clients')
        .select('id, name, email, phone, status, source')
        .eq('user_id', user.id)
        .eq('in_crm', true)
        .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
        .order('updated_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('clients')
        .select('id, name, email, phone, status, source')
        .eq('user_id', user.id)
        .eq('in_crm', false)
        .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('transactions')
        .select('id, property_address, property_city, buyer_name, seller_name, status')
        .eq('user_id', user.id)
        .or(
          `property_address.ilike.${pattern},property_city.ilike.${pattern},buyer_name.ilike.${pattern},seller_name.ilike.${pattern}`,
        )
        .order('updated_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('ad_promotions')
        .select('id, headline, primary_text, status, platform, projects:project_id ( title, property_info )')
        .eq('user_id', user.id)
        .or(`headline.ilike.${pattern},primary_text.ilike.${pattern},landing_url.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('calendar_events')
        .select('id, title, description, location, start_time, event_type')
        .eq('user_id', user.id)
        .or(`title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`)
        .order('start_time', { ascending: true })
        .limit(LIMIT),
      supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .ilike('title', pattern)
        .order('updated_at', { ascending: false })
        .limit(LIMIT),
    ]);

    const projects: SearchResult[] = (projectsRes.data ?? []).map((p) => ({
      id: p.id,
      kind: 'project',
      title: projectLabel(p),
      subtitle: p.status ? p.status.replace(/_/g, ' ') : undefined,
      href: `/dashboard/projects/${p.id}`,
    }));

    const clients: SearchResult[] = (crmClientsRes.data ?? []).map((c) => ({
      id: c.id,
      kind: 'client',
      title: c.name || 'Unnamed client',
      subtitle: [c.email, c.phone].filter(Boolean).join(' · ') || undefined,
      href: `/dashboard/clients/${c.id}`,
    }));

    const leads: SearchResult[] = (inboxClientsRes.data ?? []).map((c) => ({
      id: c.id,
      kind: 'lead',
      title: c.name || 'Unnamed lead',
      subtitle: [c.email, c.source?.replace(/_/g, ' ')].filter(Boolean).join(' · ') || undefined,
      href: `/dashboard/leads`,
    }));

    const transactions: SearchResult[] = (transactionsRes.data ?? []).map((t) => ({
      id: t.id,
      kind: 'transaction',
      title: t.property_address,
      subtitle: [t.buyer_name, t.seller_name, t.status?.replace(/_/g, ' ')].filter(Boolean).join(' · ') || undefined,
      href: `/dashboard/transactions/${t.id}`,
    }));

    const ads: SearchResult[] = (adsRes.data ?? []).map((a) => {
      const project = Array.isArray(a.projects) ? a.projects[0] : a.projects;
      return {
        id: a.id,
        kind: 'ad',
        title: a.headline || projectLabel(project ?? {}) || 'Ad campaign',
        subtitle: [a.platform, a.status].filter(Boolean).join(' · ') || undefined,
        href: `/dashboard/ads?tab=performance&ad=${a.id}`,
      };
    });

    const events: SearchResult[] = (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      kind: 'event',
      title: e.title,
      subtitle: e.start_time
        ? new Date(e.start_time).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : undefined,
      href: `/dashboard/calendar?event=${e.id}`,
    }));

    const conversations: SearchResult[] = (conversationsRes.data ?? []).map((c) => ({
      id: c.id,
      kind: 'conversation',
      title: c.title || 'Untitled chat',
      subtitle: 'AI Assistant',
      href: `/dashboard/tasks?conversation=${c.id}`,
    }));

    // Also match projects by address stored in property_info JSON (post-filter)
    let extraProjects: SearchResult[] = [];
    if (projects.length < LIMIT) {
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, title, status, property_info')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(40);

      const lowerQ = q.toLowerCase();
      const existing = new Set(projects.map((p) => p.id));
      extraProjects = (allProjects ?? [])
        .filter((p) => {
          if (existing.has(p.id)) return false;
          const info = p.property_info;
          const blob = [p.title, info?.address, info?.city, info?.state, info?.zip_code]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return blob.includes(lowerQ);
        })
        .slice(0, LIMIT - projects.length)
        .map((p) => ({
          id: p.id,
          kind: 'project' as const,
          title: projectLabel(p),
          subtitle: p.status ? p.status.replace(/_/g, ' ') : undefined,
          href: `/dashboard/projects/${p.id}`,
        }));
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: [...projects, ...extraProjects].slice(0, LIMIT),
        clients,
        leads,
        transactions,
        ads: adsRes.error?.code === '42P01' ? [] : ads,
        events,
        conversations,
      } satisfies SearchResponse,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 },
    );
  }
}
