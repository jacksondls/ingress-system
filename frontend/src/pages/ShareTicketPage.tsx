import { useEffect, useState } from 'react'
import { Alert, Spinner } from 'react-bootstrap'
import { QRCodeSVG } from 'qrcode.react'
import { useParams } from 'react-router-dom'
import { getSharedTicket, type Ticket } from '../api/orders'
import { formatSessionDateTime } from '../format'

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

  if (loading) {
    return (
      <div className="page-spinner">
        <Spinner animation="border" />
      </div>
    )
  }
  if (error || !ticket) {
    return <Alert variant="danger">{error || 'Ingresso não encontrado'}</Alert>
  }

  return (
    <div className="auth-wrap">
      <div className="surface-card ticket-card p-4 text-center">
      <p className="eyebrow mb-2">Ingresso compartilhado</p>
      <h1 className="h4">{ticket.eventTitle}</h1>
      <p className="text-muted mb-1">{ticket.venue}</p>
      <p>{formatSessionDateTime(ticket.sessionDatetime)}</p>
      <div className="d-flex justify-content-center my-3">
        <QRCodeSVG value={ticket.code} size={180} />
      </div>
      <p className="small text-break mb-0">
        <code>{ticket.code}</code>
      </p>
      </div>
    </div>
  )
}
