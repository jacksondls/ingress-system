import type { Event, EventInput, EventType } from '../types'
import { request } from './client'

export type EventWithCount = Event & { sessionCount?: number }

export async function listEvents(filters?: {
  query?: string
  type?: EventType | 'all'
  state?: string
}): Promise<EventWithCount[]> {
  const params = new URLSearchParams()
  if (filters?.query?.trim()) params.set('query', filters.query.trim())
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters?.state) params.set('state', filters.state)
  const qs = params.toString()
  return request<EventWithCount[]>(`/events/${qs ? `?${qs}` : ''}`)
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    return await request<Event>(`/events/${id}/`)
  } catch {
    return null
  }
}

export async function createEvent(input: EventInput): Promise<Event> {
  return request<Event>('/events/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<Event> {
  return request<Event>(`/events/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteEvent(id: string): Promise<void> {
  await request<void>(`/events/${id}/`, { method: 'DELETE' })
}
