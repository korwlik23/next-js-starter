// ============================================================
// THEME TOKENS — ค่าคงที่สำหรับ Design System
// ใช้ใน JS/TS เมื่อต้องอ้างอิง theme values นอก CSS
// ============================================================

// ─── Spacing Scale (px)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
} as const

// ─── Border Radius (px)
export const RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  FULL: 9999,
} as const

// ─── Font Sizes (rem)
export const FONT_SIZE = {
  XS: '0.75rem',
  SM: '0.875rem',
  BASE: '1rem',
  LG: '1.125rem',
  XL: '1.25rem',
  XXL: '1.5rem',
  XXXL: '2rem',
  DISPLAY: '2.5rem',
} as const

// ─── Font Weights
export const FONT_WEIGHT = {
  NORMAL: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
} as const

// ─── Breakpoints (px) — สอดคล้องกับ Tailwind defaults
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const

// ─── Z-Index Layers — ป้องกันการซ้อนทับที่ไม่ตั้งใจ
export const Z_INDEX = {
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
  TOAST: 80,
} as const

// ─── Animation Durations (ms)
export const DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
} as const

// ─── Transition Easings
export const EASING = {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  IN: 'cubic-bezier(0.4, 0, 1, 1)',
  OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SPRING: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const

// ─── Shadow Tokens
export const SHADOW = {
  SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const

// ─── Media Query Helpers
export const MEDIA = {
  SM: `@media (min-width: ${BREAKPOINTS.SM}px)`,
  MD: `@media (min-width: ${BREAKPOINTS.MD}px)`,
  LG: `@media (min-width: ${BREAKPOINTS.LG}px)`,
  XL: `@media (min-width: ${BREAKPOINTS.XL}px)`,
  DARK: '@media (prefers-color-scheme: dark)',
  REDUCED_MOTION: '@media (prefers-reduced-motion: reduce)',
} as const
