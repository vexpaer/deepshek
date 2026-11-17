import React from 'react'
import whaleUrl from '../assets/deepseek.svg'

export const DeepSeekWhaleLogo: React.FC<{ size?: number; className?: string }> = ({ size = 44, className }) => (
  <span role="img" aria-label="DeepSeek" className={className} style={{ display: 'inline-block', width: size, height: size, background: 'var(--dsw-alias-brand-primary)', mask: `url(${whaleUrl}) center / contain no-repeat`, WebkitMask: `url(${whaleUrl}) center / contain no-repeat`, flexShrink: 0 }} />
)

export const IconMenu: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 7H21M3 17H13"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
)

export const IconNewChat: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2.25C5.72 2.25 2.25 5.72 2.25 10C2.25 11.39 2.62 12.69 3.26 13.82L2.35 16.95L5.64 16.12C6.91 16.99 8.4 17.75 10 17.75C14.28 17.75 17.75 14.28 17.75 10C17.75 5.72 14.28 2.25 10 2.25Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M10 7V13M7 10H13"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
)

export const IconThink: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    <ellipse
      cx="9"
      cy="9"
      rx="7"
      ry="3"
      transform="rotate(30 9 9)"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <ellipse
      cx="9"
      cy="9"
      rx="7"
      ry="3"
      transform="rotate(90 9 9)"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <ellipse
      cx="9"
      cy="9"
      rx="7"
      ry="3"
      transform="rotate(150 9 9)"
      stroke="currentColor"
      strokeWidth="1.35"
    />
  </svg>
)

export const IconGlobe: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.35" stroke="currentColor" strokeWidth="1.35" />
    <ellipse cx="8" cy="8" rx="2.8" ry="6.35" stroke="currentColor" strokeWidth="1.25" />
    <path d="M2 8H14" stroke="currentColor" strokeWidth="1.25" />
  </svg>
)

export const IconPlus: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 4V16M4 10H16"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
)

export const IconPaperclip: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M15.4 9.5L9.1 15.8C7.4 17.5 4.7 17.5 3.1 15.8C1.4 14.1 1.4 11.4 3.1 9.8L10.3 2.6C11.4 1.5 13.2 1.5 14.3 2.6C15.4 3.7 15.4 5.5 14.3 6.6L7.4 13.5C6.8 14.1 5.9 14.1 5.3 13.5C4.8 12.9 4.8 12 5.3 11.4L11.3 5.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconSend: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 13V3.2M8 3.2L3.8 7.4M8 3.2L12.2 7.4"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconStop: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="3.5" y="3.5" width="9" height="9" rx="2" fill="currentColor" />
  </svg>
)

export const IconMic: React.FC<{ size?: number; filled?: boolean }> = ({
  size = 18,
  filled = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect
      x="7"
      y="2.5"
      width="6"
      height="9.5"
      rx="3"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M4.2 9.8C4.2 13 6.8 15.5 10 15.5C13.2 15.5 15.8 13 15.8 9.8M10 15.5V18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const IconCopy: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect
      x="5.5"
      y="5.5"
      width="8"
      height="8"
      rx="1.8"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <path
      d="M10.5 3.8V3.5C10.5 2.67 9.83 2 9 2H3.5C2.67 2 2 2.67 2 3.5V9C2 9.83 2.67 10.5 3.5 10.5H3.8"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
  </svg>
)

export const IconCheck: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M3.2 8.2L6.4 11.4L12.8 4.8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconRefresh: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M13.5 8A5.5 5.5 0 1 1 12 4.2M13.5 2.5V5.2H10.8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconThumbUp: React.FC<{ size?: number; active?: boolean }> = ({
  size = 16,
  active,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M5.2 7.2L7.7 2.4C8.1 1.8 9.1 2 9.2 2.8L9.1 5.6H12.4C13.3 5.6 13.9 6.5 13.7 7.4L12.6 12.2C12.4 12.9 11.8 13.4 11 13.4H5.2M5.2 7.2V13.4M5.2 7.2H3C2.45 7.2 2 7.65 2 8.2V12.4C2 12.95 2.45 13.4 3 13.4H5.2"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconThumbDown: React.FC<{ size?: number; active?: boolean }> = ({
  size = 16,
  active,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M5.2 8.8L7.7 13.6C8.1 14.2 9.1 14 9.2 13.2L9.1 10.4H12.4C13.3 10.4 13.9 9.5 13.7 8.6L12.6 3.8C12.4 3.1 11.8 2.6 11 2.6H5.2M5.2 8.8V2.6M5.2 8.8H3C2.45 8.8 2 8.35 2 7.8V3.6C2 3.05 2.45 2.6 3 2.6H5.2"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconSpeaker: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 6.2H5.5L9 3.2V12.8L5.5 9.8H3C2.45 9.8 2 9.35 2 8.8V7.2C2 6.65 2.45 6.2 3 6.2Z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
    <path
      d="M11.2 5.4C12.3 6.8 12.3 9.2 11.2 10.6M13 3.6C14.9 6 14.9 10 13 12.4"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
  </svg>
)

export const IconSettings: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M10 2.6V4.3M10 15.7V17.4M17.4 10H15.7M4.3 10H2.6M15.2 4.8L14 6M6 14L4.8 15.2M15.2 15.2L14 14M6 6L4.8 4.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const IconChevronDown: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconChevronRight: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconChevronLeft: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M12.5 4.5L7 10L12.5 15.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconSearch: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.7 10.7L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const IconClose: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M4 4L12 12M12 4L4 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const IconTrash: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M2.8 4.4H13.2M6 4.4V2.8C6 2.36 6.36 2 6.8 2H9.2C9.64 2 10 2.36 10 2.8V4.4M12 4.4L11.4 12.6C11.35 13.38 10.7 14 9.92 14H6.08C5.3 14 4.65 13.38 4.6 12.6L4 4.4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconEdit: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M11.3 2.7C11.7 2.3 12.3 2.3 12.7 2.7L13.3 3.3C13.7 3.7 13.7 4.3 13.3 4.7L6.1 11.9L3.2 12.8L4.1 9.9L11.3 2.7Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconPin: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M9.8 2.2L13.8 6.2L12.3 7.7L11.5 7.4L9.2 9.7L9.5 11.4L8.4 12.5L5.8 9.9L2.5 13.2L2.8 12.9L6.1 9.6L3.5 7L4.6 5.9L6.3 6.2L8.6 3.9L8.3 3.1L9.8 2.2Z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconKey: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="5.4" cy="8.2" r="2.9" stroke="currentColor" strokeWidth="1.45" />
    <path
      d="M8.3 8.2H14M12 8.2V10.6M14 8.2V10.2"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
    />
  </svg>
)

export const IconEye: React.FC<{ size?: number; off?: boolean }> = ({
  size = 16,
  off = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M1.6 8C2.8 5.2 5.2 3.8 8 3.8C10.8 3.8 13.2 5.2 14.4 8C13.2 10.8 10.8 12.2 8 12.2C5.2 12.2 2.8 10.8 1.6 8Z"
      stroke="currentColor"
      strokeWidth="1.35"
    />
    <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.35" />
    {off ? (
      <path d="M2.5 13.5L13.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    ) : null}
  </svg>
)

export const IconEllipsis: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="3.5" cy="8" r="1.25" fill="currentColor" />
    <circle cx="8" cy="8" r="1.25" fill="currentColor" />
    <circle cx="12.5" cy="8" r="1.25" fill="currentColor" />
  </svg>
)

export const IconArrowDown: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 3V12.5M8 12.5L4 8.5M8 12.5L12 8.5"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconImage: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="2.5" y="3.5" width="15" height="13" rx="2.6" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7.2" cy="7.8" r="1.3" fill="currentColor" />
    <path
      d="M3.5 14L7.8 10.2L11 13L13.6 10.8L17.2 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconFile: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M5 3.2H11.5L15.5 7.2V16.8C15.5 17.4 15 17.8 14.4 17.8H5C4.4 17.8 4 17.4 4 16.8V4.2C4 3.6 4.4 3.2 5 3.2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M11.2 3.4V7.5H15.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

export const IconExternalLink: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M6.2 3.2H3.5C2.8 3.2 2.2 3.8 2.2 4.5V12.5C2.2 13.2 2.8 13.8 3.5 13.8H11.5C12.2 13.8 12.8 13.2 12.8 12.5V9.8M9.5 2.2H13.8V6.5M13.6 2.4L7.5 8.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconSun: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

export const IconMoon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M13.2 9.8A5.5 5.5 0 0 1 6.2 2.8A5.7 5.7 0 1 0 13.2 9.8Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconSystem: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2.5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5.5 13.8H10.5M8 11.5V13.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

export const IconCamera: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5l1.5-2h5L16 5h3a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V8a3 3 0 013-3z" /><circle cx="12" cy="12.5" r="4" /></svg>
)
export const IconVoice: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="16" r="13.5" /><path d="M19 8a13 13 0 010 16M14.5 11a8 8 0 010 10" /><circle cx="10" cy="16" r="1.3" fill="currentColor" stroke="none" /></svg>
)
export const IconAccount: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="7" r="4.5" /><path d="M3.5 22a8.5 8.5 0 0117 0" /></svg>
)
export const IconDatabase: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="11" cy="5" rx="8" ry="3.5" /><path d="M3 5v13c0 2 3.6 3.5 8 3.5M19 5v6M3 11c0 2 3.6 3.5 8 3.5" /><circle cx="18" cy="18" r="3" /><path d="M18 13.5v1M18 21.5v1M13.5 18h1M21.5 18h1M14.8 14.8l.7.7M20.5 20.5l.7.7M14.8 21.2l.7-.7M20.5 15.5l.7-.7" /></svg>
)
export const IconInfo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v.1" /></svg>
)
export const IconHelp: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5c.3-3 6-3 5.3.5-.4 1.8-3 1.5-3 4M12 17v.1" /></svg>
)
export const IconLogout: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h5M9 12h12M17 8l4 4-4 4" /></svg>
)
export const IconFont: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 19L5 7l4 12M2.5 15h5M11 19l5-16 6 16M13 13h7" /></svg>
)
