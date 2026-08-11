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

  if (loading) return <Spinner animation="border" size="sm" />

  return (
    <>
      <h1 className="h3 mb-3">Meus ingressos</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {tickets.length === 0 ? (
        <p className="text-muted">Nenhum ingresso ainda.</p>
      ) : (
        <Row xs={1} md={2} className="g-3">
          {tickets.map((ticket) => (
            <Col key={ticket.id}>
              <Card body>
                <h2 className="h5">{ticket.eventTitle}</h2>
                <p className="mb-1 text-muted">{ticket.venue}</p>
                <p className="mb-2">
                  {new Date(ticket.sessionDatetime).toLocaleString('pt-BR')}
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
