import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import { QRCodeSVG } from 'qrcode.react'
import { cancelOrder, listMyTickets, type Ticket } from '../api/orders'
import { formatSessionDateTime, formatTicketStatus } from '../format'

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    /* fallback abaixo */
  }
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (!ok) throw new Error('copy')
}

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    void listMyTickets()
      .then(setTickets)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

  async function onCopyLink(ticket: Ticket) {
    const url = `${window.location.origin}${ticket.shareUrl}`
    try {
      await copyText(url)
      setCopiedId(ticket.id)
      window.setTimeout(() => setCopiedId((id) => (id === ticket.id ? null : id)), 2000)
    } catch {
      setError('Não foi possível copiar o link.')
    }
  }

  async function onCancel(orderId: string) {
    setCancelling(orderId)
    setError(null)
    try {
      await cancelOrder(orderId)
      setTickets((list) => list.filter((t) => t.orderId !== orderId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao cancelar')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="page-spinner">
        <Spinner animation="border" />
      </div>
    )
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Carteira</p>
        <h1 className="h3 mb-0">Meus ingressos</h1>
      </section>
      {error && <Alert variant="danger">{error}</Alert>}
      {tickets.length === 0 ? (
        <div className="empty-state">
          <p className="mb-0">Nenhum ingresso ainda.</p>
        </div>
      ) : (
        <Row xs={1} md={2} className="g-3">
          {tickets.map((ticket) => (
            <Col key={ticket.id}>
              <Card body className="ticket-card surface-card">
                <h2 className="h5">{ticket.eventTitle}</h2>
                <p className="mb-1 text-muted">{ticket.venue}</p>
                <p className="mb-2">
                  {formatSessionDateTime(ticket.sessionDatetime)}
                  {ticket.seatLabel ? ` · Assento ${ticket.seatLabel}` : ''}
                </p>
                <p className="small mb-2">
                  Status: <strong>{formatTicketStatus(ticket.status)}</strong>
                </p>
                <div className="d-flex justify-content-center mb-3">
                  <QRCodeSVG value={ticket.code} size={160} />
                </div>
                <p className="small text-break">
                  <code>{ticket.code}</code>
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => void onCopyLink(ticket)}
                  >
                    {copiedId === ticket.id ? 'Copiado' : 'Copiar link de compartilhamento'}
                  </Button>
                  {!tickets.some(
                    (t) => t.orderId === ticket.orderId && t.status === 'used',
                  ) && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={cancelling === ticket.orderId}
                      onClick={() => void onCancel(ticket.orderId)}
                    >
                      {cancelling === ticket.orderId ? '...' : 'Cancelar pedido'}
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}
