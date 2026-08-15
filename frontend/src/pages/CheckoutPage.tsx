import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, Spinner, Stack, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { cancelOrder, payOrder, type Order } from '../api/orders'
import { request } from '../api/client'
import {
  formatCountdown,
  formatOrderStatus,
  formatPrice,
  formatSessionDateTime,
  HOLD_MS,
} from '../format'

type PayMethod = 'card' | 'boleto' | 'pix'

function digits(value: string, max: number) {
  return value.replace(/\D/g, '').slice(0, max)
}

function maskCpf(value: string) {
  const d = digits(value, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  const d = digits(value, 11)
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function maskCep(value: string) {
  const d = digits(value, 8)
  return d.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '')
}

function maskCard(value: string) {
  return digits(value, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim()
}

function maskExpiry(value: string) {
  const d = digits(value, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [method, setMethod] = useState<PayMethod>('card')
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

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

  const buyerOk = fullName.trim().length > 2 && digits(cpf, 11).length === 11
  const expiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
  const cardOk =
    buyerOk &&
    email.includes('@') &&
    digits(phone, 11).length >= 10 &&
    digits(cep, 8).length === 8 &&
    address.trim().length > 4 &&
    digits(cardNumber, 16).length === 16 &&
    cardName.trim().length > 2 &&
    expiryOk &&
    digits(cvv, 4).length >= 3
  const formOk = method === 'card' ? cardOk : buyerOk

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

  async function onPay(e: FormEvent) {
    e.preventDefault()
    if (!formOk) return
    await pay(true)
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
    <div className="auth-wrap" style={{ maxWidth: 560 }}>
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
          <strong>Status:</strong> {formatOrderStatus(order.status)}
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

          {!expired && (
            <Form onSubmit={(e) => void onPay(e)} className="mb-3">
              <p className="small mb-2">Forma de pagamento</p>
              <ToggleButtonGroup
                type="radio"
                name="pay-method"
                value={method}
                onChange={(value) => setMethod(value as PayMethod)}
                className="mb-3 flex-wrap"
              >
                <ToggleButton id="pay-card" value="card" variant="outline-secondary">
                  Cartão
                </ToggleButton>
                <ToggleButton id="pay-boleto" value="boleto" variant="outline-secondary">
                  Boleto
                </ToggleButton>
                <ToggleButton id="pay-pix" value="pix" variant="outline-secondary">
                  PIX
                </ToggleButton>
              </ToggleButtonGroup>

              <Form.Group className="mb-2">
                <Form.Label>Nome completo</Form.Label>
                <Form.Control
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>CPF</Form.Label>
                <Form.Control
                  required
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                />
              </Form.Group>

              {method === 'card' && (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>E-mail</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Telefone</Form.Label>
                    <Form.Control
                      required
                      inputMode="numeric"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>CEP</Form.Label>
                    <Form.Control
                      required
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(maskCep(e.target.value))}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Endereço</Form.Label>
                    <Form.Control
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Número do cartão</Form.Label>
                    <Form.Control
                      required
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCard(e.target.value))}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Nome impresso no cartão</Form.Label>
                    <Form.Control
                      required
                      autoComplete="cc-name"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </Form.Group>
                  <Stack direction="horizontal" gap={2} className="mb-2">
                    <Form.Group className="flex-grow-1">
                      <Form.Label>Validade</Form.Label>
                      <Form.Control
                        required
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                      />
                    </Form.Group>
                    <Form.Group style={{ width: 120 }}>
                      <Form.Label>CVV</Form.Label>
                      <Form.Control
                        required
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvv}
                        onChange={(e) => setCvv(digits(e.target.value, 4))}
                      />
                    </Form.Group>
                  </Stack>
                </>
              )}

              {method === 'boleto' && (
                <p className="small text-muted">O boleto será gerado na confirmação (simulado).</p>
              )}
              {method === 'pix' && (
                <p className="small text-muted">PIX simulado: o pagamento é confirmado na hora.</p>
              )}

              <Button type="submit" disabled={busy || expired || !formOk}>
                Pagar
              </Button>
            </Form>
          )}

          <Stack direction="horizontal" gap={2} className="flex-wrap">
            <Button
              variant="outline-danger"
              disabled={busy || expired}
              onClick={() => void pay(false)}
            >
              Simular recusa
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
