// Projects list page - Shows all user projects

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import { Plus, FolderKanban } from 'lucide-react';
import { Project } from '@/types';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';

export default function ProjectsPage() {
  const toast = useToast();
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

  React.useEffect(() => {
    document.title = 'Projects - Realestic';
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        mutate();
      } else {
        toast.error('Failed to delete project: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardPage
      title="Projects"
      subtitle="Manage your property listing projects"
      actions={
        <Link data-tour="projects-new" href="/dashboard/projects/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      }
    >
      <PageToolbar
        meta={`Showing ${filteredProjects.length} of ${projects.length} projects`}
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <SearchInput
            data-tour="projects-search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            data-tour="projects-filter"
            className="field-select sm:min-w-[160px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </PageToolbar>

      {isLoading && projects.length === 0 ? (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white shadow-sm p-4 h-64" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          icon={FolderKanban}
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
        />
      )}
    </DashboardPage>
  );
}
