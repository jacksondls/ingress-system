export type EventType = 'show' | 'filme'

export type Event = {
  id: string
  title: string
  type: EventType
  description: string
  venue: string
  imageUrl?: string
  createdAt: string
}

export type Session = {
  id: string
  eventId: string
  datetime: string
  room?: string
  price: number
  capacity: number
}

export type EventInput = Omit<Event, 'id' | 'createdAt'>
export type SessionInput = Omit<Session, 'id'>
