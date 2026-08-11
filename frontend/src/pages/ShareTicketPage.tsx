import { useEffect, useState } from 'react'
import { Alert, Spinner } from 'react-bootstrap'
import { QRCodeSVG } from 'qrcode.react'
import { useParams } from 'react-router-dom'
import { getSharedTicket, type Ticket } from '../api/orders'

export function ShareTicketPage() {
  const { token } = useParams<{ token: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    void getSharedTicket(token)
      .then(setTicket)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Spinner animation="border" size="sm" />
  if (error || !ticket) {
    return <Alert variant="danger">{error || 'Ingresso não encontrado'}</Alert>
  }

  return (
    <>
      <h1 className="h3 mb-3">Ingresso compartilhado</h1>
      <p className="fw-semibold">{ticket.eventTitle}</p>
      <p className="text-muted">{ticket.venue}</p>
      <p>{new Date(ticket.sessionDatetime).toLocaleString('pt-BR')}</p>
      <div className="d-flex justify-content-center my-3">
        <QRCodeSVG value={ticket.code} size={180} />
      </div>
      <p className="small text-break">
        <code>{ticket.code}</code>
      </p>
    </>
  )
}
