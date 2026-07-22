import clsx from 'clsx';

interface PanelHeaderProps {
  title: string;
  /** Optional mono count / meta on the right (e.g. "3 ITEMS") */
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Shared dense panel bar used across dashboard Surfaces (home, tables, lists). */
export default function PanelHeader({ title, meta, action, className }: PanelHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 px-4 py-[11px] border-b border-gray-150 shrink-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-[12.5px] font-semibold text-gray-900 truncate">{title}</h2>
        {meta != null && (
          <span className="font-mono text-[10.5px] font-medium text-gray-600 tracking-[0.04em] shrink-0">
            {meta}
          </span>
        )}
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  );
}
