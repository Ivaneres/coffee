import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

const defaults = { size: 22, 'aria-hidden': true as const };

export const IconCup: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path
      d="M4 7h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M7 19h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M8 3v2M11 2.5V5M14 7V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M6.2 17.8l1.4-1.4M16.4 7.6l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconBack: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconEdit: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path
      d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M5 7h14M10 11v6M14 11v6M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconMinus: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = defaults.size, className, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...rest}>
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    <path d="M5 19.5c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);
