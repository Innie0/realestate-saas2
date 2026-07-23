import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function SkeletonTableShell({
  headers,
  rows,
  renderRow,
  className,
  tableClassName,
  containerClassName,
}: {
  headers: readonly string[];
  rows: number;
  renderRow: (index: number) => ReactNode;
  className?: string;
  tableClassName?: string;
  containerClassName?: string;
}) {
  return (
    <Card className={clsx('overflow-hidden p-0', className)}>
      <div className={clsx('overflow-x-auto', containerClassName)}>
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow>
              {headers.map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>{renderRow(index)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
