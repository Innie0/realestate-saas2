import clsx from 'clsx';

interface SectionHeadingProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ title, action, className }: SectionHeadingProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-3 mb-4', className)}>
      <h2 className="text-title font-semibold tracking-tight text-gray-900">{title}</h2>
      {action}
    </div>
  );
}
