// Projects list page - Shows all user projects
// Displays project cards with filtering and search

'use client'; // This page uses client-side features

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import { Plus, Search, Filter } from 'lucide-react';
import { Project } from '@/types';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';

/**
 * Projects page component
 * Displays a list of all user projects with search and filter
 */
export default function ProjectsPage() {
  useTour({
    tourKey: 'tour_projects',
    steps: [
      {
        element: '[data-tour="projects-new"]',
        popover: {
          title: '🏡 Create a Listing Project',
          description: 'Each project is for one property. Enter the address and details, then Realestic generates AI-powered descriptions, social captions, and more.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="projects-search"]',
        popover: {
          title: '🔍 Find Your Projects',
          description: 'Search by address or description to quickly jump to any listing you\'ve worked on.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="projects-filter"]',
        popover: {
          title: '📋 Filter by Status',
          description: 'Keep track of what\'s a draft, in progress, or completed. Great for staying organized when you have multiple active listings.',
          side: 'bottom',
        },
      },
    ],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: projects = [], isLoading, mutate } = useApi<Project[]>('/api/projects');

  // Set page title
  React.useEffect(() => {
    document.title = 'Projects - Realestic';
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        mutate();
      } else {
        alert('Failed to delete project: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="Projects" 
        subtitle="Manage your property listing projects"
      />

      <PageShell>
        {/* Toolbar - search, filter, and create button */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6">
          {/* Search input */}
          <div data-tour="projects-search" className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-gray-900 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter and Create button */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <select
              data-tour="projects-filter"
              className="px-3 sm:px-4 py-2 text-sm bg-gray-100 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-gray-900"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Create new project button */}
            <Link data-tour="projects-new" href="/dashboard/projects/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Projects count */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects grid */}
        {isLoading && projects.length === 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-200">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Filter}
            title="No projects found"
            description={
              searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first listing project.'
            }
            action={
              !searchQuery && filterStatus === 'all' ? (
                <Link href="/dashboard/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              ) : undefined
            }
            className="bg-white rounded-xl border border-gray-200"
          />
        )}
      </PageShell>
    </div>
  );
}

