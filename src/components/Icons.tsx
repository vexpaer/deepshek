import React from 'react'

export const DeepSeekWhaleLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="DeepSeek"
  >
    {/* DeepSeek iconic left-facing blue whale mark */}
    <path
      d="M52.5 22.8C54.6 18.8 57.5 16.9 59.5 17.6C60.7 18.0 60.8 19.7 59.8 21.5C58.6 23.7 56.3 25.4 54.0 26.8C55.9 27.0 58.2 27.6 59.2 29.2C60.2 30.8 59.0 32.9 56.5 33.4C54.0 33.9 51.2 32.8 49.4 31.3C48.1 39.2 42.3 47.0 32.9 49.4C22.4 52.1 11.4 47.6 7.4 38.6C5.6 34.6 5.6 29.9 7.6 26.0C10.8 19.8 17.8 16.4 24.8 17.8C26.2 18.1 27.6 18.7 28.8 19.6C29.4 16.7 31.2 13.7 34.4 12.2C35.8 11.5 37.3 11.8 37.8 12.9C38.4 14.1 37.4 15.8 36.1 17.2C34.9 18.5 34.5 20.1 35.2 21.4C38.9 23.6 42.2 26.4 45.6 27.2C48.3 27.8 50.8 26.0 52.5 22.8Z"
      fill="#4D6BFE"
    />
    {/* Subtle belly / smile contour */}
    <path
      d="M11.6 35.8C13.8 41.8 20.2 46.2 28.4 45.8C32.4 45.6 36.0 44.1 38.6 41.7C36.9 40.3 34.2 39.8 31.4 40.6C29.0 41.3 26.7 41.0 24.9 39.5C22.5 37.4 20.1 35.8 16.5 35.5C14.6 35.3 12.9 35.4 11.6 35.8Z"
      fill="#FFFFFF"
      fillOpacity="0.92"
    />
    {/* Whale eye */}
    <circle cx="17.2" cy="27.2" r="2.2" fill="#FFFFFF" />
    {/* Dorsal / pectoral detail */}
    <path
      d="M27.8 31.6C30.2 30.2 33.4 31.2 34.8 33.9C32.1 35.2 28.8 34.4 27.8 31.6Z"
      fill="#FFFFFF"
      fillOpacity="0.28"
    />
  </svg>
)

export const IconMenu: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 6.5H20M4 12H15.5M4 17.5H20"
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
