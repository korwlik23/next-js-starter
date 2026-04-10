import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Notifications panel
  notificationsOpen: boolean
  toggleNotifications: () => void

  // Global loading
  isPageLoading: boolean
  setPageLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      notificationsOpen: false,
      toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),

      isPageLoading: false,
      setPageLoading: (loading) => set({ isPageLoading: loading }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
