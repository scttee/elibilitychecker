import type { ReactNode } from 'react'

type IconProps = { className?: string; title: string }

const IconWrapper = ({ children, className, title }: { children: ReactNode; className?: string; title: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" role="img" className={className}>
    <title>{title}</title>
    {children}
  </svg>
)

export const ClipboardIcon = ({ className, title }: IconProps) => (
  <IconWrapper className={className} title={title}>
    <rect x="7" y="5" width="10" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9.5 5.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M9.5 10h5m-5 3h5m-5 3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </IconWrapper>
)

export const WarningIcon = ({ className, title }: IconProps) => (
  <IconWrapper className={className} title={title}>
    <path d="M12 4 21 20H3L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </IconWrapper>
)

export const ArrowPathIcon = ({ className, title }: IconProps) => (
  <IconWrapper className={className} title={title}>
    <path d="M6 8a7 7 0 0 1 11-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17 3v3h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 16a7 7 0 0 1-11 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 21v-3h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </IconWrapper>
)
