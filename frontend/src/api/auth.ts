import { clearAuth, request, setAuth, type AuthUser } from './client'

type LoginResponse = {
  access: string
  refresh: string
  user: AuthUser
}

export async function login(username: string, password: string) {
  const data = await request<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAuth(data.access, data.refresh, data.user)
  return data.user
}

export function logout() {
  clearAuth()
}

export async function fetchMe() {
  return request<AuthUser>('/auth/me/')
}
