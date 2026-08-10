import { useEffect, useState } from 'react'
import { Badge, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { getEventById } from '../api/events'
import { SessionManager } from '../components/SessionManager'
import type { Event } from '../types'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void getEventById(id).then((data) => {
      if (!cancelled) {
        setEvent(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <Spinner animation="border" role="status" size="sm" />
  }

  if (!event) {
    return (
      <>
        <p>Evento não encontrado.</p>
        <Link to="/">Voltar</Link>
      </>
    )
  }

  return (
    <>
      <Link to="/" className="d-inline-block mb-3">
        ← Voltar
      </Link>
      <div className="d-flex align-items-center gap-2 mb-2">
        <h1 className="h3 mb-0">{event.title}</h1>
        <Badge bg={event.type === 'show' ? 'info' : 'secondary'}>
          {event.type === 'show' ? 'Show' : 'Filme'}
        </Badge>
      </div>
      <p className="text-muted mb-2">{event.venue}</p>
      <p className="mb-4">{event.description}</p>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt=""
          className="img-fluid rounded mb-4"
          style={{ maxHeight: 280 }}
        />
      )}
      <SessionManager eventId={event.id} />
    </>
  )
}
