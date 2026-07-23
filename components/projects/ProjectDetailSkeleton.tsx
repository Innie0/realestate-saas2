import DashboardPage from '@/components/layout/DashboardPage';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

const PROPERTY_FIELDS = 7;
const IMAGE_SLOTS = 4;

export function ProjectDetailHeaderActionsSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-[88px] rounded-lg" />
      <Skeleton className="h-9 w-[76px] rounded-lg" />
      <Skeleton className="h-9 w-[96px] rounded-lg" />
      <Skeleton className="h-9 w-[100px] rounded-lg" />
    </>
  );
}

export function ProjectDetailTabsSkeleton() {
  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="flex gap-[26px]" aria-hidden>
        <div className="relative py-3">
          <Skeleton className="h-4 w-[72px]" />
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500/40" />
        </div>
        <div className="py-3">
          <Skeleton className="h-4 w-[72px]" />
        </div>
        <div className="py-3">
          <Skeleton className="h-4 w-[48px]" />
        </div>
      </nav>
    </div>
  );
}

function ProjectDetailImagesCardSkeleton() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-[15px] w-[128px]" />
        <Skeleton className="h-9 w-[140px] rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: IMAGE_SLOTS }).map((_, index) => (
          <Skeleton key={index} className="h-[130px] w-full rounded-lg" />
        ))}
      </div>
    </Card>
  );
}

function ProjectDetailPropertyInfoSkeleton() {
  return (
    <Card className="p-5 sm:p-6">
      <Skeleton className="mb-4 h-[15px] w-[160px]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PROPERTY_FIELDS }).map((_, index) => (
          <div
            key={index}
            className={`space-y-2 rounded-lg bg-gray-50 p-3.5 ${index === PROPERTY_FIELDS - 1 ? 'col-span-full sm:col-span-1' : ''}`}
          >
            <Skeleton className="h-[10.5px] w-20" />
            <Skeleton className={`h-[14px] ${index === PROPERTY_FIELDS - 1 ? 'w-28' : 'w-32'}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProjectDetailPageContentSkeleton() {
  return (
    <>
      <ProjectDetailTabsSkeleton />
      <div className="space-y-5">
        <ProjectDetailImagesCardSkeleton />
        <ProjectDetailPropertyInfoSkeleton />
      </div>
    </>
  );
}

export function ProjectDetailPageLoadingShell() {
  return (
    <DashboardPage
      title="Project"
      subtitle="Loading project details"
      actions={<ProjectDetailHeaderActionsSkeleton />}
    >
      <ProjectDetailPageContentSkeleton />
    </DashboardPage>
  );
}
