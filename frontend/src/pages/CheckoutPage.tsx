import { useEffect, useState } from 'react'
import { Alert, Button, Spinner, Stack } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { cancelOrder, payOrder, type Order } from '../api/orders'
import { request } from '../api/client'
import {
  formatCountdown,
  formatPrice,
  formatSessionDateTime,
  HOLD_MS,
} from '../format'

export function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!orderId) return
    void request<Order>(`/orders/${orderId}/`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    if (order?.status !== 'pending') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [order?.status])

  async function pay(approve: boolean) {
    if (!orderId) return
    setBusy(true)
    setError(null)
    try {
      const updated = await payOrder(orderId, approve)
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no pagamento')
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    if (!orderId) return
    setBusy(true)
    setError(null)
    try {
      setOrder(await cancelOrder(orderId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cancelar')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="page-spinner">
        <Spinner animation="border" />
      </div>
    )
  }
  if (!order) return <Alert variant="danger">{error || 'Pedido não encontrado'}</Alert>

  const remaining = Math.max(
    0,
    new Date(order.createdAt).getTime() + HOLD_MS - now,
  )
  const expired = order.status === 'pending' && remaining === 0
  const seatLabels = (order.seats ?? [])
    .map((s) => s.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="auth-wrap">
      <h1 className="h3 mb-3">Checkout</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="surface-card p-4 mb-3">
        <p>
          <strong>Sessão:</strong> {formatSessionDateTime(order.session.datetime)}
        </p>
        {seatLabels ? (
          <p>
            <strong>Assentos:</strong> {seatLabels}
          </p>
        ) : null}
        <p>
          <strong>Quantidade:</strong> {order.quantity}
        </p>
        <p>
          <strong>Total:</strong> {formatPrice(order.session.price * order.quantity)}
        </p>
        <p className="mb-0">
          <strong>Status:</strong> {order.status}
        </p>
      </div>

      {order.status === 'pending' && (
        <>
          <p className="mb-2">Pagamento simulado</p>
          {expired ? (
            <Alert variant="warning">
              Reserva expirada. Os assentos foram liberados.
            </Alert>
          ) : (
            <p className="text-muted mb-3">
              Tempo restante: <strong>{formatCountdown(remaining)}</strong>
            </p>
          )}
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button disabled={busy || expired} onClick={() => void pay(true)}>
              Confirmar pagamento
            </Button>
            <Button
              variant="outline-danger"
              disabled={busy || expired}
              onClick={() => void pay(false)}
            >
              Recusar pagamento
            </Button>
            <Button
              variant="outline-secondary"
              disabled={busy || expired}
              onClick={() => void cancel()}
            >
              Cancelar pedido
            </Button>
          </Stack>
        </>
      )}

      {order.status === 'paid' && (
        <Alert variant="success">
          Pagamento aprovado!{' '}
          <Link to="/meus-ingressos">Ver meus ingressos</Link>
        </Alert>
      )}

      {order.status === 'failed' && (
        <Alert variant="warning">Pagamento recusado. Pedido não gerou ingressos.</Alert>
      )}

      {order.status === 'cancelled' && (
        <Alert variant="secondary">Pedido cancelado. Assentos e vagas voltaram ao estoque.</Alert>
      )}
    </div>
  )
}
