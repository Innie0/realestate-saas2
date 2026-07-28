import clsx from 'clsx';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ListPageToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  sort?: React.ReactNode;
  addLabel?: string;
  onAdd?: () => void;
  addHref?: string;
  addButton?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/**
 * Consistent list-page controls: search left, sort + primary action right.
 * Matches Instantly AI Agents list header pattern.
 */
export default function ListPageToolbar({
  search,
  filters,
  sort,
  addLabel = 'Add New',
  onAdd,
  addHref,
  addButton,
  meta,
  className,
}: ListPageToolbarProps) {
  const addAction =
    addButton ??
    (addHref ? (
      <Link href={addHref} className="shrink-0">
        <Button size="sm" className="w-full sm:w-auto whitespace-nowrap">
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </Link>
    ) : onAdd ? (
      <Button size="sm" onClick={onAdd} className="w-full sm:w-auto whitespace-nowrap">
        <Plus className="size-4" />
        {addLabel}
      </Button>
    ) : null);

  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {search}
          {filters}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {sort}
          {addAction}
        </div>
      </div>
      {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
    </div>
  );
}
