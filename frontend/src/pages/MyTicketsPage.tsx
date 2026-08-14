import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import { QRCodeSVG } from 'qrcode.react'
import { listMyTickets, type Ticket } from '../api/orders'

export function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void listMyTickets()
      .then(setTickets)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [])

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
                  {new Date(ticket.sessionDatetime).toLocaleString('pt-BR')}
                  {ticket.seatLabel ? ` · Assento ${ticket.seatLabel}` : ''}
                </p>
                <p className="small mb-2">
                  Status: <strong>{ticket.status}</strong>
                </p>
                <div className="d-flex justify-content-center mb-3">
                  <QRCodeSVG value={ticket.code} size={160} />
                </div>
                <p className="small text-break">
                  <code>{ticket.code}</code>
                </p>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    const url = `${window.location.origin}${ticket.shareUrl}`
                    void navigator.clipboard.writeText(url)
                  }}
                >
                  Copiar link de compartilhamento
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}
