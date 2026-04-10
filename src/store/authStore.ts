import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  permissions?: string[]
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
  isAuthenticated: () => boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      clearUser: () => set({ user: null }),

      isAuthenticated: () => !!get().user,

      hasPermission: (permission) => {
        const user = get().user
        if (!user) return false
        const perms = user.permissions ?? []
        if (perms.includes('*')) return true
        const [module] = permission.split('.')
        if (perms.includes(`${module}.*`)) return true
        return perms.includes(permission)
      },

      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        return user.roles.includes(role)
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
