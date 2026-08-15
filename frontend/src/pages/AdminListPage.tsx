import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Modal, Stack, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { deleteEvent, listEvents, type EventWithCount } from '../api/events'

export function AdminListPage() {
  const [events, setEvents] = useState<EventWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await listEvents()
    setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function confirmDelete() {
    if (!deleteId) return
    setError(null)
    try {
      await deleteEvent(deleteId)
      setDeleteId(null)
      await load()
    } catch (err) {
      setDeleteId(null)
      setError(err instanceof Error ? err.message : 'Falha ao excluir')
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="eyebrow mb-1">Organizador</p>
          <h1 className="h3 mb-0">Gerenciar eventos</h1>
        </div>
        <Link to="/admin/eventos/novo" className="btn btn-primary">
          Novo evento
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : events.length === 0 ? (
        <p className="text-muted">Nenhum evento cadastrado.</p>
      ) : (
        <div className="surface-card p-2 p-md-3">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Local</th>
              <th>Sessões</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>
                  <Badge
                    pill
                    className={event.type === 'show' ? 'badge-show' : 'badge-filme'}
                  >
                    {event.type === 'show' ? 'Show' : 'Filme'}
                  </Badge>
                </td>
                <td>{event.venue}</td>
                <td>{event.sessionCount ?? 0}</td>
                <td>
                  <Stack direction="horizontal" gap={2}>
                    <Link
                      className="btn btn-sm btn-outline-primary"
                      to={`/admin/eventos/${event.id}`}
                    >
                      Editar
                    </Link>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setDeleteId(event.id)}
                    >
                      Excluir
                    </Button>
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        </div>
      )}

      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Excluir evento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza? As sessões vinculadas também serão removidas.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void confirmDelete()}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
