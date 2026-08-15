import { request } from './client'
import type { Seat, Session } from '../types'

export type Order = {
  id: string
  quantity: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  session: Session & { available?: number }
  tickets?: Ticket[]
  seats?: Seat[]
  createdAt: string
}

export type Ticket = {
  id: string
  orderId: string
  code: string
  status: 'valid' | 'used'
  usedAt?: string | null
  shareToken: string
  shareUrl: string
  eventId: string
  eventTitle: string
  sessionDatetime: string
  venue: string
  seatLabel?: string | null
}

export async function createOrder(
  sessionId: string,
  quantity: number,
  seatIds?: string[],
) {
  return request<Order>('/orders/', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      quantity,
      seatIds: seatIds ?? [],
    }),
  })
}

export async function payOrder(orderId: string, approve: boolean) {
  return request<Order>(`/orders/${orderId}/pay/`, {
    method: 'POST',
    body: JSON.stringify({ approve }),
  })
}

export async function cancelOrder(orderId: string) {
  return request<Order>(`/orders/${orderId}/cancel/`, {
    method: 'POST',
  })
}

export async function listMyTickets() {
  return request<Ticket[]>('/tickets/mine/')
}

export async function getSharedTicket(token: string) {
  return request<Ticket>(`/tickets/share/${token}/`)
}

export async function validateGate(code: string, eventId: string) {
  return request<{
    result: 'valid' | 'invalid' | 'already_used' | 'wrong_event'
    detail: string
    ticket?: Ticket
    eventTitle?: string
    usedAt?: string
  }>('/gate/validate/', {
    method: 'POST',
    body: JSON.stringify({ code, eventId }),
  })
}

export type TmdbMovie = {
  tmdbId: number
  title: string
  overview: string
  imageUrl: string
  releaseDate: string
}

export type TicketmasterAttraction = {
  ticketmasterId: string
  title: string
  overview: string
  imageUrl: string
  url: string
}

export async function searchTmdb(query: string) {
  const data = await request<{ results: TmdbMovie[] }>(
    `/tmdb/search/?query=${encodeURIComponent(query)}`,
  )
  return data.results
}

export async function searchTicketmaster(query: string) {
  const data = await request<{ results: TicketmasterAttraction[] }>(
    `/ticketmaster/search/?query=${encodeURIComponent(query)}`,
  )
  return data.results
}
