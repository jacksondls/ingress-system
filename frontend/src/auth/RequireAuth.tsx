import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

type Props = {
  roles?: Array<'organizer' | 'client' | 'gate'>
}

export function RequireAuth({ roles }: Props) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && (!user.role || !roles.includes(user.role))) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
