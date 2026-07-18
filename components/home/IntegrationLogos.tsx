type IntegrationLogoProps = {
  id: string;
  className?: string;
};

export function IntegrationLogo({ id, className = 'h-7 w-7' }: IntegrationLogoProps) {
  switch (id) {
    case 'google-calendar':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="17" rx="3" fill="#4285F4" />
          <rect x="3" y="4" width="18" height="5" fill="#1967D2" />
          <rect x="7" y="2" width="2" height="4" rx="1" fill="#1967D2" />
          <rect x="15" y="2" width="2" height="4" rx="1" fill="#1967D2" />
          <rect x="7" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="11" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="15" y="12" width="3" height="3" rx="0.5" fill="white" />
        </svg>
      );
    case 'google-ads':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3L3 20h4.5l1.5-3.5h6L18.5 20H22L12 3z" fill="#FBBC04" />
          <path d="M12 3L7.5 12.5H12V3z" fill="#34A853" />
          <path d="M12 12.5L16.5 20H22L12 3v9.5z" fill="#4285F4" />
        </svg>
      );
    case 'meta-ads':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="metaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0081FB" />
              <stop offset="100%" stopColor="#0064E0" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#metaGrad)" />
          <path
            d="M8 14.5c0-2.5 1.2-4.5 2.8-4.5 1 0 1.5 1 2.2 2.5.7-1.5 1.2-2.5 2.2-2.5 1.6 0 2.8 2 2.8 4.5"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'lead-forms':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="3" fill="#FC5C03" />
          <rect x="7" y="7" width="10" height="2" rx="1" fill="white" fillOpacity="0.95" />
          <rect x="7" y="11" width="10" height="2" rx="1" fill="white" fillOpacity="0.75" />
          <rect x="7" y="15" width="6" height="2" rx="1" fill="white" fillOpacity="0.75" />
        </svg>
      );
    default:
      return null;
  }
}
