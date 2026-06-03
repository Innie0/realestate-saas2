// Dashboard home page - Main dashboard overview
// Shows statistics, recent projects, and quick actions

'use client'; // This page uses client-side features

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import NotificationsPanel from '@/components/NotificationsPanel';
import ProjectCard from '@/components/ProjectCard';
import { Plus, Zap, Users, ArrowRight, Clock, FolderKanban } from 'lucide-react';
import { Project } from '@/types';

interface RecentClient { id: string; name: string; email?: string; status: string; created_at: string; }
interface RecentTransaction { id: string; property_address: string; status: string; offer_price?: number; updated_at: string; }

interface UsageData {
  [key: string]: { current: number; limit: number };
}

/**
 * Dashboard home page component
 * Overview of user's projects and statistics
 */
export default function DashboardPage() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<'starter' | 'pro'>('starter');

  useEffect(() => {
    document.title = 'Dashboard - Realestic';
  }, []);

  useEffect(() => {
    fetchRecentProjects();
    fetchUsage();
    fetchRecentActivity();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      const result = await response.json();
      if (result.success) {
        setUsage(result.data);
        if (result.plan) setPlan(result.plan);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [clientsRes, txRes] = await Promise.all([
        fetch('/api/clients?limit=4'),
        fetch('/api/transactions?limit=4'),
      ]);
      const clientsData = await clientsRes.json();
      const txData = await txRes.json();
      if (clientsData.success) setRecentClients(clientsData.data.slice(0, 4));
      if (txData.success) setRecentTransactions(txData.data.slice(0, 4));
    } catch (e) { console.error('Recent activity error:', e); }
  };

  const fetchRecentProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=3');
      const result = await response.json();
      
      if (result.success) {
        setRecentProjects(result.data);
      }
    } catch (error) {
      console.error('Error fetching recent projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's an overview of your projects."
      />

      {/* Page content */}
      <div className="p-4 sm:p-6 space-y-6 text-white">
        {/* Quick actions */}
        <div className="flex gap-4">
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
          <Link href="/dashboard/clients">
            <Button variant="outline">
              Manage Clients
            </Button>
          </Link>
        </div>

        {/* Notifications Panel */}
        <NotificationsPanel />

        {/* Plan Usage */}
        {usage && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-white/60" />
                <h2 className="text-lg font-bold text-white">Plan Usage</h2>
              </div>
              <Link href="/dashboard/upgrade">
                <Button variant="outline" size="sm">Upgrade</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { key: 'projects', label: 'Projects', period: '/mo' },
                { key: 'property_lookups', label: 'Lookups', period: plan === 'pro' ? '' : '/mo' },
                { key: 'ai_messages', label: 'AI Messages', period: '/mo' },
                { key: 'clients', label: 'Clients', period: 'total' },
                { key: 'transactions', label: 'Transactions', period: 'total' },
                { key: 'calendar_events', label: 'Events', period: '' },
              ].map(({ key, label, period }) => {
                const item = usage[key];
                if (!item) return null;
                const isUnlimited = item.limit === -1;
                const pct = isUnlimited ? 0 : Math.min((item.current / item.limit) * 100, 100);
                const isNearLimit = !isUnlimited && pct >= 80;
                const isAtLimit = !isUnlimited && pct >= 100;
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className={`text-lg font-bold ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'}`}>
                      {isUnlimited
                        ? <span className="text-gray-500 text-base font-normal">∞</span>
                        : <>{item.current}<span className="text-gray-500 text-sm font-normal">/{item.limit}</span></>
                      }
                    </p>
                    {!isUnlimited && (
                      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-white'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">{period}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent projects section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Projects</h2>
            <Link href="/dashboard/projects">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {projectsLoading ? (
            // Loading skeletons
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            // Empty state - shown when no projects exist
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-400 mb-4">
                Get started by creating your first property listing project
              </p>
              <Link href="/dashboard/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            // Display recent projects
            <div className="grid gap-6 md:grid-cols-3">
              {recentProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Clients */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-white/60" />
                <h2 className="text-base font-semibold text-white">Recent Clients</h2>
              </div>
              <Link href="/dashboard/clients" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentClients.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No clients yet</p>
            ) : (
              <div className="space-y-2">
                {recentClients.map(client => (
                  <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-white">{client.name}</p>
                        {client.email && <p className="text-xs text-gray-500 truncate max-w-[160px]">{client.email}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      client.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'
                    }`}>{client.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Transactions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white/60" />
                <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
              </div>
              <Link href="/dashboard/transactions" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map(tx => (
                  <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[200px]">{tx.property_address}</p>
                      {tx.offer_price && <p className="text-xs text-gray-500">${tx.offer_price.toLocaleString()}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'closed' ? 'bg-white/10 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{tx.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

