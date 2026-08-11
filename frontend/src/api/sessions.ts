import type { Session, SessionInput } from '../types'
import { request } from './client'

export async function listSessionsByEvent(eventId: string): Promise<Session[]> {
  return request<Session[]>(`/events/${eventId}/sessions/`)
}

export async function createSession(input: SessionInput): Promise<Session> {
  return request<Session>('/sessions/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateSession(
  id: string,
  input: SessionInput,
): Promise<Session | null> {
  try {
    return await request<Session>(`/sessions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  } catch {
    return null
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  try {
    await request<void>(`/sessions/${id}/`, { method: 'DELETE' })
    return true
  } catch {
    return false
  }
}
