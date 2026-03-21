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
import { Plus, FolderKanban, Image, FileText, TrendingUp, Zap } from 'lucide-react';
import { Project } from '@/types';

interface UsageData {
  [key: string]: { current: number; limit: number };
}

interface DashboardStats {
  totalProjects: number;
  projectsThisMonth: number;
  totalImages: number;
  imagesThisWeek: number;
  aiContentCount: number;
  aiContentThisWeek: number;
}

/**
 * Dashboard home page component
 * Overview of user's projects and statistics
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    document.title = 'Dashboard - Realestic';
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentProjects();
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      const result = await response.json();
      if (result.success) setUsage(result.data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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

  // Build stats array from real data
  const statsCards = stats ? [
    {
      name: 'Total Projects',
      value: stats.totalProjects.toString(),
      icon: FolderKanban,
      change: stats.projectsThisMonth > 0 
        ? `+${stats.projectsThisMonth} this month` 
        : 'No new projects this month',
      changeType: stats.projectsThisMonth > 0 ? 'positive' : 'neutral',
    },
    {
      name: 'Images Uploaded',
      value: stats.totalImages.toString(),
      icon: Image,
      change: stats.imagesThisWeek > 0 
        ? `+${stats.imagesThisWeek} this week` 
        : 'No new images this week',
      changeType: stats.imagesThisWeek > 0 ? 'positive' : 'neutral',
    },
    {
      name: 'AI Content Generated',
      value: stats.aiContentCount.toString(),
      icon: FileText,
      change: stats.aiContentThisWeek > 0 
        ? `+${stats.aiContentThisWeek} this week` 
        : 'No AI content this week',
      changeType: stats.aiContentThisWeek > 0 ? 'positive' : 'neutral',
    },
  ] : [];

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

        {/* Statistics cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            // Loading skeletons
            [1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </Card>
            ))
          ) : (
            statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.name} className="border-l-4 border-l-purple-500/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        {stat.name}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                      <p className={`mt-2 text-sm ${
                        stat.changeType === 'positive' 
                          ? 'text-green-400' 
                          : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Plan Usage */}
        {usage && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Plan Usage</h2>
              </div>
              <Link href="/dashboard/upgrade">
                <Button variant="outline" size="sm">Upgrade</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { key: 'projects', label: 'Projects', period: '/mo' },
                { key: 'property_lookups', label: 'Lookups', period: '/mo' },
                { key: 'ai_messages', label: 'AI Messages', period: '/mo' },
                { key: 'clients', label: 'Clients', period: '' },
                { key: 'transactions', label: 'Transactions', period: '' },
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
                      {item.current}{!isUnlimited && <span className="text-gray-500 text-sm font-normal">/{item.limit}</span>}
                      {isUnlimited && <span className="text-gray-500 text-xs font-normal ml-1">∞</span>}
                    </p>
                    {!isUnlimited && (
                      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-purple-500'}`}
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

        {/* Tips and resources section */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">
            Tips & Resources
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <TrendingUp className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-white">
                  Use high-quality photos
                </h3>
                <p className="text-sm text-gray-400">
                  Properties with professional photos get 60% more views and sell faster.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-white">
                  Leverage AI-generated content
                </h3>
                <p className="text-sm text-gray-400">
                  Let AI create compelling descriptions that highlight your property's best features.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

