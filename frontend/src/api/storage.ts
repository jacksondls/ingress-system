import type { Event, Session } from '../types'

const EVENTS_KEY = 'ingresso_events'
const SESSIONS_KEY = 'ingresso_sessions'
const SEEDED_KEY = 'ingresso_seeded'

const seedEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Arctic Monkeys ao Vivo',
    type: 'show',
    description: 'Turnê mundial com os clássicos e músicas novas.',
    venue: 'Allianz Parque, São Paulo',
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'evt-2',
    title: 'Duna: Parte Dois',
    type: 'filme',
    description: 'Paul Atreides une forças com Chani e os Fremen.',
    venue: 'Cinemark Shopping Eldorado',
    createdAt: '2026-01-12T12:00:00.000Z',
  },
  {
    id: 'evt-3',
    title: 'Stand-up com Diogo Portugal',
    type: 'show',
    description: 'Noite de comédia com o comediante Diogo Portugal.',
    venue: 'Teatro Bradesco, São Paulo',
    createdAt: '2026-02-01T12:00:00.000Z',
  },
  {
    id: 'evt-4',
    title: 'Oppenheimer',
    type: 'filme',
    description: 'A história de J. Robert Oppenheimer e a bomba atômica.',
    venue: 'Kinoplex Bourbon',
    createdAt: '2026-02-05T12:00:00.000Z',
  },
]

const seedSessions: Session[] = [
  {
    id: 'ses-1',
    eventId: 'evt-1',
    datetime: '2026-09-15T21:00:00.000Z',
    room: 'Palco Principal',
    price: 280,
    capacity: 5000,
  },
  {
    id: 'ses-2',
    eventId: 'evt-1',
    datetime: '2026-09-16T21:00:00.000Z',
    room: 'Palco Principal',
    price: 320,
    capacity: 5000,
  },
  {
    id: 'ses-3',
    eventId: 'evt-2',
    datetime: '2026-08-20T14:00:00.000Z',
    room: 'Sala 3',
    price: 42,
    capacity: 180,
  },
  {
    id: 'ses-4',
    eventId: 'evt-2',
    datetime: '2026-08-20T19:30:00.000Z',
    room: 'Sala 3',
    price: 48,
    capacity: 180,
  },
  {
    id: 'ses-5',
    eventId: 'evt-3',
    datetime: '2026-08-25T20:00:00.000Z',
    room: 'Auditório',
    price: 90,
    capacity: 600,
  },
  {
    id: 'ses-6',
    eventId: 'evt-4',
    datetime: '2026-08-18T16:00:00.000Z',
    room: 'Sala IMAX',
    price: 55,
    capacity: 220,
  },
]

function read<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function ensureSeed(): void {
  if (localStorage.getItem(SEEDED_KEY)) return
  write(EVENTS_KEY, seedEvents)
  write(SESSIONS_KEY, seedSessions)
  localStorage.setItem(SEEDED_KEY, '1')
}

export function getEvents(): Event[] {
  ensureSeed()
  return read<Event>(EVENTS_KEY)
}

export function setEvents(events: Event[]): void {
  write(EVENTS_KEY, events)
}

export function getSessions(): Session[] {
  ensureSeed()
  return read<Session>(SESSIONS_KEY)
}

export function setSessions(sessions: Session[]): void {
  write(SESSIONS_KEY, sessions)
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
