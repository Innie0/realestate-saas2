// Projects list page - Shows all user projects

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import ProjectCard from '@/components/ProjectCard';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
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
          title: 'Create a listing project',
          description: 'Each project is for one property. Enter the address and details, then Oikaro generates AI-powered descriptions, social captions, and more.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="projects-search"]',
        popover: {
          title: 'Find your projects',
          description: 'Search by address or description to quickly jump to any listing you\'ve worked on.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="projects-filter"]',
        popover: {
          title: 'Filter by status',
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
    document.title = 'Projects - Oikaro';
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
        meta={
          !isLoading && projects.length > 0
            ? `Showing ${filteredProjects.length} of ${projects.length} projects`
            : undefined
        }
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <SearchInput
            data-tour="projects-search"
            placeholder="Search projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            containerClassName="flex-1"
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            className="sm:min-w-[160px]"
            data-tour="projects-filter"
            options={[
              { value: 'all', label: 'All status' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>
      </PageToolbar>

      {isLoading && projects.length === 0 ? (
        <Surface flat padding="none">
          <DataLoadingState
            title="Loading projects"
            description="Fetching your listing projects…"
          />
        </Surface>
      ) : filteredProjects.length > 0 ? (
        <StaggerList className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {filteredProjects.map((project) => (
            <StaggerItem key={project.id}>
              <ProjectCard
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <Surface flat padding="none">
          <EmptyState
            icon={FolderKanban}
            title={searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
            description={
              searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters to find a listing project.'
                : 'Create your first listing project to generate AI descriptions, social posts, and marketing content.'
            }
            action={
              !searchQuery && filterStatus === 'all' ? (
                <Link href="/dashboard/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create project
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </Surface>
      )}
    </DashboardPage>
  );
}
