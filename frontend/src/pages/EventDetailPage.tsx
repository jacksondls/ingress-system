import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEventById } from '../api/events'
import { listSessionsByEvent } from '../api/sessions'
import { createOrder } from '../api/orders'
import { useAuth } from '../auth/AuthContext'
import type { Event, Session } from '../types'

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

  async function buy(session: Session) {
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

  if (loading) return <Spinner animation="border" size="sm" />
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

      {error && <Alert variant="danger">{error}</Alert>}

      <h2 className="h5">Sessões</h2>
      {sessions.length === 0 ? (
        <p className="text-muted">Nenhuma sessão.</p>
      ) : (
        <Table responsive striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Sala</th>
              <th>Preço</th>
              <th>Disponíveis</th>
              <th>Qtd</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{formatDateTime(session.datetime)}</td>
                <td>{session.room || '—'}</td>
                <td>{formatPrice(session.price)}</td>
                <td>{session.available ?? session.capacity}</td>
                <td style={{ maxWidth: 90 }}>
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
                </td>
                <td>
                  <Button
                    size="sm"
                    disabled={
                      buyingId === session.id ||
                      (session.available ?? 0) < 1
                    }
                    onClick={() => void buy(session)}
                  >
                    {buyingId === session.id ? '...' : 'Reservar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
