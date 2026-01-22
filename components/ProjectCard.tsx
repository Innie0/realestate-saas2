// ProjectCard component - Displays a project in card format
// Used on the Projects page to show a list of projects

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import Card from './ui/Card';
import { Calendar, MapPin, Home, Trash2 } from 'lucide-react';

/**
 * ProjectCardProps - Props for the ProjectCard component
 */
interface ProjectCardProps {
  project: Project; // The project data to display
  onDelete?: () => void; // Optional delete callback
}

/**
 * ProjectCard component
 * Displays a project with thumbnail, title, and key information
 */
export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  // Get the first image as thumbnail, or use placeholder
  const thumbnailUrl = project.images && project.images.length > 0 
    ? project.images[0] 
    : '/placeholder-property.jpg';

  // Format the date
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Get status badge color
  const statusColors = {
    draft: 'bg-gray-500/20 text-gray-300 border border-gray-400/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
    completed: 'bg-green-500/20 text-green-300 border border-green-400/30',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="relative">
      <Link href={`/dashboard/projects/${project.id}`}>
        <Card padding="none" hover>
        {/* Project thumbnail image */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-gray-700">
          <img
            src={thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
          {/* Status badge - positioned in top right corner */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Project details */}
        <div className="p-4">
          {/* Project title */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
            {project.title}
          </h3>

          {/* Project description */}
          {project.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Property information - displayed as icons with text */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
            {project.property_type && (
              <div className="flex items-center gap-1">
                <Home className="w-4 h-4" />
                <span className="capitalize">{project.property_type}</span>
              </div>
            )}
            {project.property_info?.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{project.property_info.city || 'Address'}</span>
              </div>
            )}
          </div>

          {/* Creation date */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{createdDate}</span>
          </div>
        </div>
      </Card>
    </Link>

    {/* Delete button - positioned outside the link */}
    {onDelete && (
      <button
        onClick={handleDelete}
        className="absolute top-2 left-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
        title="Delete project"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
  );
}

