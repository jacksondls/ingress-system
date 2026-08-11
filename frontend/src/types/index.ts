export type EventType = 'show' | 'filme'

export type Event = {
  id: string
  title: string
  type: EventType
  description: string
  venue: string
  imageUrl?: string
  tmdbId?: number | null
  createdAt: string
  sessionCount?: number
}

export type Session = {
  id: string
  eventId: string
  datetime: string
  room?: string
  price: number
  capacity: number
  sold?: number
  available?: number
}

export type EventInput = Omit<Event, 'id' | 'createdAt' | 'sessionCount'>
export type SessionInput = Omit<Session, 'id' | 'sold' | 'available'>
