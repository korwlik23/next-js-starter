import { api } from './apiClient'

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
}

export const userService = {
  list: (params: UserListParams = {}) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.search) qs.set('search', params.search)
    return api.get(`/api/user?${qs}`)
  },
  getById: (id: string) => api.get(`/api/user/${id}`),
  create: (data: unknown) => api.post('/api/user', data),
  update: (id: string, data: unknown) => api.patch(`/api/user/${id}`, data),
  delete: (id: string) => api.delete(`/api/user/${id}`),
}

export const authService = {
  me: () => api.get('/api/auth/me'),
  login: (data: { email: string; password: string }) => api.post('/api/auth/login', data),
  register: (data: unknown) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout', {}),
  refresh: () => api.post('/api/auth/refresh', {}),
}
