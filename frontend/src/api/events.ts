import type { Event, EventInput, EventType } from '../types'
import { getEvents, getSessions, newId, setEvents, setSessions } from './storage'

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 80))
}

export async function listEvents(filters?: {
  query?: string
  type?: EventType | 'all'
}): Promise<Event[]> {
  let events = getEvents()
  const query = filters?.query?.trim().toLowerCase()
  const type = filters?.type ?? 'all'

  if (type !== 'all') {
    events = events.filter((e) => e.type === type)
  }
  if (query) {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query),
    )
  }

  return delay(events.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')))
}

export async function getEventById(id: string): Promise<Event | null> {
  return delay(getEvents().find((e) => e.id === id) ?? null)
}

export async function createEvent(input: EventInput): Promise<Event> {
  const event: Event = {
    ...input,
    id: newId('evt'),
    createdAt: new Date().toISOString(),
  }
  setEvents([...getEvents(), event])
  return delay(event)
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<Event | null> {
  const events = getEvents()
  const index = events.findIndex((e) => e.id === id)
  if (index < 0) return delay(null)
  const updated: Event = { ...events[index], ...input }
  events[index] = updated
  setEvents(events)
  return delay(updated)
}

export async function deleteEvent(id: string): Promise<boolean> {
  const events = getEvents()
  const next = events.filter((e) => e.id !== id)
  if (next.length === events.length) return delay(false)
  setEvents(next)
  setSessions(getSessions().filter((s) => s.eventId !== id))
  return delay(true)
}
