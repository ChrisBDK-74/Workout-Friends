import type { SVGProps } from 'react';

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CalendarIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);
export const ListIcon = () => (
  <Icon>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </Icon>
);
export const DumbbellIcon = () => (
  <Icon>
    <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
  </Icon>
);
export const ChevronLeft = () => (
  <Icon>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);
export const ChevronRight = () => (
  <Icon>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const PlusIcon = () => (
  <Icon strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
