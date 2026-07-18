// ProjectCard component - Displays a project in card format
// Used on the Projects page to show a list of projects

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Calendar, MapPin, Home, Trash2 } from 'lucide-react';

/**
 * ProjectCardProps - Props for the ProjectCard component
 */
interface ProjectCardProps {
  project: Project; // The project data to display
  onDelete?: () => void; // Optional delete callback
}

// Cycled gradient placeholders for projects without a photo yet — matches
// the "console" design handoff's soft tan / sage / slate thumbnail treatment.
const THUMB_GRADIENTS = [
  'linear-gradient(135deg, #ded2ba 0%, #c4b48f 100%)',
  'linear-gradient(135deg, #d6ded6 0%, #a9c0af 100%)',
  'linear-gradient(135deg, #d7dde3 0%, #aebac6 100%)',
  'linear-gradient(135deg, #e3d9c8 0%, #cdb99a 100%)',
];

function gradientForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return THUMB_GRADIENTS[hash % THUMB_GRADIENTS.length];
}

/**
 * ProjectCard component
 * Displays a project with thumbnail, title, and key information
 */
export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  // Get the first image as thumbnail, if one has been uploaded
  const firstImage = project.images && project.images.length > 0 ? project.images[0] : null;
  const thumbnailUrl = firstImage
    ? (typeof firstImage === 'string' ? firstImage : firstImage.url)
    : null;

  // Format the date
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const statusLabel =
    project.status === 'completed'
      ? 'Completed'
      : project.status === 'in_progress'
        ? 'In progress'
        : 'Draft';
  const statusClass =
    project.status === 'completed'
      ? 'bg-teal-50/90 text-teal-700'
      : project.status === 'in_progress'
        ? 'bg-amber-50/90 text-amber-800'
        : 'bg-white/85 text-gray-700';

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group block rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
    >
      {/* Thumbnail */}
      <div
        className="relative h-[170px] w-full overflow-hidden"
        style={!thumbnailUrl ? { background: gradientForId(project.id) } : undefined}
      >
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="w-10 h-10 text-black/15" strokeWidth={1.25} />
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2.5 left-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full text-white transition-colors hover:bg-black/70"
            style={{ backgroundColor: 'rgba(20,20,20,0.55)' }}
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Status pill */}
        <span
          className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold text-gray-900 truncate">{project.title}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-gray-600">
          {project.property_type && (
            <div className="flex items-center gap-1">
              <Home className="w-[13px] h-[13px] text-gray-600" />
              <span className="capitalize">{project.property_type}</span>
            </div>
          )}
          {project.property_info?.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-[13px] h-[13px] text-gray-600" />
              <span className="line-clamp-1">{project.property_info.city}</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 font-mono text-[12px] text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{createdDate}</span>
        </div>
      </div>
    </Link>
  );
}
