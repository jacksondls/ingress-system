import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getStoredUser, type AuthUser } from '../api/client'
import * as authApi from '../api/auth'

type AuthContextValue = {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('ingresso-logout', onLogout)
    return () => window.removeEventListener('ingresso-logout', onLogout)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(username, password) {
        const next = await authApi.login(username, password)
        setUser(next)
        return next
      },
      logout() {
        authApi.logout()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
