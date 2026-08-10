import type { Session, SessionInput } from '../types'
import { getSessions, newId, setSessions } from './storage'

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 80))
}

export async function listSessionsByEvent(eventId: string): Promise<Session[]> {
  const sessions = getSessions()
    .filter((s) => s.eventId === eventId)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
  return delay(sessions)
}

export async function createSession(input: SessionInput): Promise<Session> {
  const session: Session = { ...input, id: newId('ses') }
  setSessions([...getSessions(), session])
  return delay(session)
}

export async function updateSession(
  id: string,
  input: SessionInput,
): Promise<Session | null> {
  const sessions = getSessions()
  const index = sessions.findIndex((s) => s.id === id)
  if (index < 0) return delay(null)
  const updated: Session = { ...sessions[index], ...input, id }
  sessions[index] = updated
  setSessions(sessions)
  return delay(updated)
}

export async function deleteSession(id: string): Promise<boolean> {
  const sessions = getSessions()
  const next = sessions.filter((s) => s.id !== id)
  if (next.length === sessions.length) return delay(false)
  setSessions(next)
  return delay(true)
}

export async function countSessionsByEventIds(
  eventIds: string[],
): Promise<Record<string, number>> {
  const sessions = getSessions()
  const counts: Record<string, number> = {}
  for (const id of eventIds) counts[id] = 0
  for (const s of sessions) {
    if (s.eventId in counts) counts[s.eventId] += 1
  }
  return delay(counts)
}
