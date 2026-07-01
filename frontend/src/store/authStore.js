import { create } from 'zustand'
import { authApi } from '../api/services'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') ?? null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.login({ email, password })
      const { token, user } = res.data

      localStorage.setItem('token', token)
      set({ token, user, isLoading: false })
      return { success: true }
    } catch (err) {
      const message =
        err.response?.data?.message ?? 'Login gagal, coba lagi.'
      set({ isLoading: false, error: message })
      return { success: false, message }
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch (_) {
      // tetap logout meski request gagal
    }
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const res = await authApi.me()
      set({ user: res.data })
    } catch (_) {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))

export default useAuthStore