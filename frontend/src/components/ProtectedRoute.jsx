import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { token, user, fetchMe } = useAuthStore()
  const [checking, setChecking] = useState(!user && !!token)

  useEffect(() => {
    if (token && !user) {
      fetchMe().finally(() => setChecking(false))
    }
  }, [token, user, fetchMe])

  if (!token) return <Navigate to="/login" replace />
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    )
  }

  return children
}