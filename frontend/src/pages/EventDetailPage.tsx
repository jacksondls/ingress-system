import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventById } from '../api/events'
import { createOrder } from '../api/orders'
import { listSeats, listSessionsByEvent } from '../api/sessions'
import { useAuth } from '../auth/AuthContext'
import { SeatMap } from '../components/SeatMap'
import {
  formatPrice,
  formatSessionDate,
  formatSessionDateTime,
  formatSessionTime,
} from '../format'
import type { Event, Seat, Session } from '../types'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [seatSessionId, setSeatSessionId] = useState<string | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [seatsLoading, setSeatsLoading] = useState(false)
  const [seatTakenAlert, setSeatTakenAlert] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void Promise.all([getEventById(id), listSessionsByEvent(id)])
      .then(([ev, ses]) => {
        if (cancelled) return
        setEvent(ev)
        setSessions(ses)
      })
      .catch((err) => {
        if (cancelled) return
        setEvent(null)
        setSessions([])
        setError(err instanceof Error ? err.message : 'Falha ao carregar evento')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!seatSessionId) return
    const timer = window.setInterval(() => {
      void listSeats(seatSessionId)
        .then((next) => {
          setSeats(next)
          const free = new Set(
            next.filter((s) => s.status === 'available').map((s) => s.id),
          )
          setSelectedSeatIds((ids) => {
            const kept = ids.filter((seatId) => free.has(seatId))
            if (kept.length < ids.length) setSeatTakenAlert(true)
            return kept
          })
        })
        .catch(() => undefined)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [seatSessionId])

  async function openSeatMap(session: Session) {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'client') {
      setError('Apenas clientes podem comprar ingressos.')
      return
    }
    setSeatSessionId(session.id)
    setSelectedSeatIds([])
    setSeatTakenAlert(false)
    setSeatsLoading(true)
    setError(null)
    try {
      setSeats(await listSeats(session.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar assentos')
      setSeatSessionId(null)
    } finally {
      setSeatsLoading(false)
    }
  }

  async function buyQuantity(session: Session) {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'client') {
      setError('Apenas clientes podem comprar ingressos.')
      return
    }
    const qty = quantities[session.id] || 1
    setBuyingId(session.id)
    setError(null)
    try {
      const order = await createOrder(session.id, qty)
      navigate(`/checkout/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na reserva')
    } finally {
      setBuyingId(null)
    }
  }

  async function buySeats() {
    if (!seatSessionId || selectedSeatIds.length === 0) return
    setBuyingId(seatSessionId)
    setError(null)
    try {
      const order = await createOrder(
        seatSessionId,
        selectedSeatIds.length,
        selectedSeatIds,
      )
      navigate(`/checkout/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na reserva')
    } finally {
      setBuyingId(null)
    }
  }

  function toggleSeat(seatId: string) {
    const seat = seats.find((s) => s.id === seatId)
    if (!seat || seat.status !== 'available') return
    setSelectedSeatIds((ids) =>
      ids.includes(seatId) ? ids.filter((id) => id !== seatId) : [...ids, seatId],
    )
  }

  if (loading) {
    return (
      <div className="page-spinner">
        <Spinner animation="border" />
      </div>
    )
  }
  if (!event) {
    return (
      <div className="empty-state">
        <p>Evento não encontrado.</p>
        <Link to="/">Voltar</Link>
      </div>
    )
  }

  const seatSession = sessions.find((s) => s.id === seatSessionId)

  return (
    <>
      <Link to="/" className="d-inline-block mb-3 text-decoration-none">
        ← Voltar
      </Link>
      <Row className="g-4 mb-4">
        <Col md={4}>
          <div
            className="event-card-cover rounded-4"
            style={
              event.imageUrl
                ? { backgroundImage: `url(${event.imageUrl})`, height: 320 }
                : { height: 320 }
            }
          />
        </Col>
        <Col md={8}>
          <Badge
            pill
            className={`mb-2 ${event.type === 'show' ? 'badge-show' : 'badge-filme'}`}
          >
            {event.type === 'show' ? 'Show' : 'Filme'}
          </Badge>
          <h1 className="h2 mb-2">{event.title}</h1>
          <p className="text-muted mb-3">{event.venue}</p>
          <p className="mb-0">{event.description}</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <h2 className="h5">Sessões</h2>
      {sessions.length === 0 ? (
        <p className="text-muted">Nenhuma sessão.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {sessions.map((session) => {
            const isSeats = session.seatingMode === 'seats'
            const available = session.available ?? session.capacity
            return (
              <div key={session.id} className="session-card">
                <div className="session-card-body">
                  <p className="session-card-room mb-1">
                    {session.room || 'Sala'}
                  </p>
                  <p className="session-card-time mb-1">
                    <strong>{formatSessionTime(session.datetime)}</strong>
                    {' · '}
                    {formatSessionDate(session.datetime)}
                  </p>
                  <p className="text-muted small mb-1">{available} vagas</p>
                  <p className="session-card-price mb-2 mb-md-0">
                    {formatPrice(session.price)}
                  </p>
                  {!isSeats && (
                    <Form.Control
                      className="session-card-qty mt-2"
                      type="number"
                      min={1}
                      max={available}
                      value={quantities[session.id] ?? 1}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [session.id]: Number(e.target.value),
                        }))
                      }
                    />
                  )}
                </div>
                <Button
                  className="session-card-buy"
                  disabled={buyingId === session.id || available < 1}
                  onClick={() =>
                    void (isSeats ? openSeatMap(session) : buyQuantity(session))
                  }
                >
                  {buyingId === session.id ? '...' : 'Comprar'}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {seatSessionId && (
        <div className="surface-card p-3 mt-4">
          <h3 className="h6">
            Mapa — {seatSession ? formatSessionDateTime(seatSession.datetime) : ''}
          </h3>
          {seatTakenAlert && (
            <Alert variant="warning">
              Assento acabou de ser reservado por outro usuário.
            </Alert>
          )}
          {seatsLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <SeatMap
                seats={seats}
                selectedIds={selectedSeatIds}
                onToggle={toggleSeat}
              />
              <div className="d-flex gap-2">
                <Button
                  disabled={selectedSeatIds.length === 0 || buyingId === seatSessionId}
                  onClick={() => void buySeats()}
                >
                  Reservar {selectedSeatIds.length || ''} assento(s)
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSeatSessionId(null)
                    setSelectedSeatIds([])
                    setSeatTakenAlert(false)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
