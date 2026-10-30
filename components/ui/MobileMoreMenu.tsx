'use client';

import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface MoreMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Red, and placed last after a divider (e.g. Delete) */
  danger?: boolean;
  disabled?: boolean;
}

/**
 * "⋯ More" menu shown only on phones, holding the secondary or risky actions
 * that sit as separate buttons on larger screens.
 */
export default function MobileMoreMenu({ items, className }: { items: MoreMenuItem[]; className?: string }) {
  const regular = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);

  return (
    <div className={cn('sm:hidden', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="size-4" />
            More
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {regular.map(({ label, icon: Icon, onClick, disabled }) => (
            <DropdownMenuItem key={label} onClick={onClick} disabled={disabled}>
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
          {regular.length > 0 && danger.length > 0 ? <DropdownMenuSeparator /> : null}
          {danger.map(({ label, icon: Icon, onClick, disabled }) => (
            <DropdownMenuItem
              key={label}
              onClick={onClick}
              disabled={disabled}
              className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
            >
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
