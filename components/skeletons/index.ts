export { SKELETON_COUNTS, CLIENT_TABLE_HEADERS, OPEN_DEALS_HEADERS } from '@/components/skeletons/constants';

export { SkeletonStatBlock, SkeletonMetricStrip, SkeletonStatPair } from '@/components/skeletons/StatBlock';
export {
  SkeletonClientTableRow,
  SkeletonOpenDealTableRow,
  SkeletonInboxRow,
} from '@/components/skeletons/TableRow';
export { SkeletonTableShell } from '@/components/skeletons/Table';
export { SkeletonProjectCard, SkeletonProjectGrid } from '@/components/skeletons/ProjectCard';
export { SkeletonDealCard, SkeletonDealList } from '@/components/skeletons/DealCard';
export {
  SkeletonToolbar,
  SkeletonClientsToolbar,
  SkeletonProjectsToolbar,
  SkeletonTransactionsToolbar,
} from '@/components/skeletons/Toolbar';
export { SkeletonFormCard, SkeletonFormCards } from '@/components/skeletons/FormCard';

export {
  ClientsListSkeleton,
  ProjectsListSkeleton,
  TransactionsListSkeleton,
  LeadsSectionSwitcherSkeleton,
  LeadsInboxSkeleton,
  LeadsInboxPageSkeleton,
  DetailHeroSkeleton,
  DetailTwoColumnSkeleton,
  LeadsSubpageContentSkeleton,
  OpenHousesListSkeleton,
  NewProjectFormSkeleton,
  BrandKitSkeleton,
} from '@/components/skeletons/pages';

// Page-specific shells that compose the shared primitives (kept near their domains).
export {
  ProjectDetailPageContentSkeleton,
  ProjectDetailPageLoadingShell,
  ProjectDetailHeaderActionsSkeleton,
} from '@/components/projects/ProjectDetailSkeleton';

export { CalendarPageBodySkeleton } from '@/components/dashboard/skeletons/CalendarScheduleSkeleton';
export { AdsPageBodySkeleton } from '@/components/dashboard/skeletons/AdsPageSkeleton';
export { AccountPageBodySkeleton } from '@/components/dashboard/skeletons/AccountFormSkeleton';
export { PropertyResearchPageBodySkeleton } from '@/components/dashboard/skeletons/PropertyResearchSkeleton';
export { TasksChatSkeleton } from '@/components/dashboard/skeletons/TasksChatSkeleton';
