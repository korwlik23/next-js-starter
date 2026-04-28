// ============================================================
// LAYOUT — barrel export สำหรับ layout components
// ============================================================

// ─── Layout Structure
export { default as MainLayout } from './MainLayout'
export { Sidebar } from './Sidebar'
export { TopNav } from './TopNav'

// ─── Theme
export { ThemeProvider } from './ThemeProvider'
export { ThemeToggle } from './ThemeToggle'

// ─── i18n
export { LanguageSwitcher } from './LanguageSwitcher'

// ─── Notification
// ใชั UI NotificationDropdown แทน

// ─── Providers
export { QueryProvider } from './QueryProvider'

// ─── Error Handling
export { ErrorBoundary } from './ErrorBoundary'

// ─── Permission Guards (Can, CanAny, CanAll)
export { Can, CanAny, CanAll } from './Can'
