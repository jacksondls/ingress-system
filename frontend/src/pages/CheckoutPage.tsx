import { useEffect, useState } from 'react'
import { Alert, Button, Spinner, Stack } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { payOrder, type Order } from '../api/orders'
import { request } from '../api/client'

export function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!orderId) return
    void request<Order>(`/orders/${orderId}/`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [orderId])

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

  if (loading) return <Spinner animation="border" size="sm" />
  if (!order) return <Alert variant="danger">{error || 'Pedido não encontrado'}</Alert>

  return (
    <>
      <h1 className="h3 mb-3">Checkout</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <p>
        <strong>Evento:</strong> {order.session?.eventId ? '' : ''}
        sessão {new Date(order.session.datetime).toLocaleString('pt-BR')}
      </p>
      <p>
        <strong>Quantidade:</strong> {order.quantity}
      </p>
      <p>
        <strong>Total:</strong>{' '}
        {(order.session.price * order.quantity).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>
      <p>
        <strong>Status:</strong> {order.status}
      </p>

      {order.status === 'pending' && (
        <Stack direction="horizontal" gap={2}>
          <Button disabled={busy} onClick={() => void pay(true)}>
            Confirmar pagamento
          </Button>
          <Button
            variant="outline-danger"
            disabled={busy}
            onClick={() => void pay(false)}
          >
            Recusar pagamento
          </Button>
        </Stack>
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
    </>
  )
}
