import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventById } from '../api/events'
import { createOrder } from '../api/orders'
import { listSeats, listSessionsByEvent } from '../api/sessions'
import { useAuth } from '../auth/AuthContext'
import { SeatMap } from '../components/SeatMap'
import type { Event, Seat, Session } from '../types'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void Promise.all([getEventById(id), listSessionsByEvent(id)]).then(
      ([ev, ses]) => {
        if (cancelled) return
        setEvent(ev)
        setSessions(ses)
        setLoading(false)
      },
    )
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
          setSelectedSeatIds((ids) => ids.filter((seatId) => free.has(seatId)))
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
        <div className="surface-card p-2 p-md-3">
        <Table responsive hover size="sm" className="mb-0">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Sala</th>
              <th>Modo</th>
              <th>Preço</th>
              <th>Disponíveis</th>
              <th>Qtd</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const isSeats = session.seatingMode === 'seats'
              return (
                <tr key={session.id}>
                  <td>{formatDateTime(session.datetime)}</td>
                  <td>{session.room || '—'}</td>
                  <td>{isSeats ? 'Assentos' : 'Pista'}</td>
                  <td>{formatPrice(session.price)}</td>
                  <td>{session.available ?? session.capacity}</td>
                  <td style={{ maxWidth: 90 }}>
                    {isSeats ? (
                      '—'
                    ) : (
                      <Form.Control
                        type="number"
                        min={1}
                        max={session.available ?? session.capacity}
                        value={quantities[session.id] ?? 1}
                        onChange={(e) =>
                          setQuantities((q) => ({
                            ...q,
                            [session.id]: Number(e.target.value),
                          }))
                        }
                      />
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      disabled={
                        buyingId === session.id || (session.available ?? 0) < 1
                      }
                      onClick={() =>
                        void (isSeats ? openSeatMap(session) : buyQuantity(session))
                      }
                    >
                      {isSeats ? 'Escolher assentos' : buyingId === session.id ? '...' : 'Reservar'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        </div>
      )}

      {seatSessionId && (
        <div className="surface-card p-3 mt-4">
          <h3 className="h6">
            Mapa — {seatSession ? formatDateTime(seatSession.datetime) : ''}
          </h3>
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
