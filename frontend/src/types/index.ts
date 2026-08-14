export type EventType = 'show' | 'filme'
export type SeatingMode = 'quantity' | 'seats'
export type SeatStatus = 'available' | 'held' | 'sold'

export type Event = {
  id: string
  title: string
  type: EventType
  description: string
  venue: string
  state: string
  imageUrl?: string
  tmdbId?: number | null
  ticketmasterId?: string
  createdAt: string
  sessionCount?: number
  sessions?: Session[]
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
  seatingMode?: SeatingMode
  seatRows?: number
  seatCols?: number
}

export type Seat = {
  id: string
  row: string
  number: number
  label: string
  status: SeatStatus
}

export type EventInput = Omit<Event, 'id' | 'createdAt' | 'sessionCount'>
export type SessionInput = Omit<Session, 'id' | 'sold' | 'available'>
