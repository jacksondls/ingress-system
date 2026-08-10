import { useEffect, useState, type FormEvent } from 'react'
import {
  Button,
  Form,
  Modal,
  Stack,
  Table,
} from 'react-bootstrap'
import * as sessionsApi from '../api/sessions'
import type { Session, SessionInput } from '../types'

type Props = {
  eventId: string
  editable?: boolean
}

const emptyForm = {
  datetime: '',
  room: '',
  price: '',
  capacity: '',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SessionManager({ eventId, editable = false }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [validated, setValidated] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await sessionsApi.listSessionsByEvent(eventId)
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [eventId])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setValidated(false)
    setShowModal(true)
  }

  function openEdit(session: Session) {
    setEditing(session)
    const local = new Date(session.datetime)
    const pad = (n: number) => String(n).padStart(2, '0')
    const localValue = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`
    setForm({
      datetime: localValue,
      room: session.room ?? '',
      price: String(session.price),
      capacity: String(session.capacity),
    })
    setValidated(false)
    setShowModal(true)
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const price = Number(form.price)
    const capacity = Number(form.capacity)
    const valid =
      form.datetime &&
      !Number.isNaN(price) &&
      price >= 0 &&
      Number.isInteger(capacity) &&
      capacity > 0

    setValidated(true)
    if (!valid) return

    const input: SessionInput = {
      eventId,
      datetime: new Date(form.datetime).toISOString(),
      room: form.room.trim() || undefined,
      price,
      capacity,
    }

    if (editing) {
      await sessionsApi.updateSession(editing.id, input)
    } else {
      await sessionsApi.createSession(input)
    }

    setShowModal(false)
    await load()
  }

  async function confirmDelete() {
    if (!deleteId) return
    await sessionsApi.deleteSession(deleteId)
    setDeleteId(null)
    await load()
  }

  if (loading) return <p className="text-muted">Carregando sessões...</p>

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Sessões</h2>
        {editable && (
          <Button size="sm" onClick={openCreate}>
            Nova sessão
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted">Nenhuma sessão cadastrada.</p>
      ) : (
        <Table responsive striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Sala</th>
              <th>Preço</th>
              <th>Vagas</th>
              {editable && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{formatDateTime(session.datetime)}</td>
                <td>{session.room || '—'}</td>
                <td>{formatPrice(session.price)}</td>
                <td>{session.capacity}</td>
                {editable && (
                  <td>
                    <Stack direction="horizontal" gap={2}>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openEdit(session)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setDeleteId(session.id)}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form noValidate validated={validated} onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editing ? 'Editar sessão' : 'Nova sessão'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="session-datetime">
              <Form.Label>Data e hora</Form.Label>
              <Form.Control
                type="datetime-local"
                required
                value={form.datetime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, datetime: e.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">
                Informe a data e hora.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="session-room">
              <Form.Label>Sala (opcional)</Form.Label>
              <Form.Control
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="session-price">
              <Form.Label>Preço</Form.Label>
              <Form.Control
                type="number"
                min={0}
                step="0.01"
                required
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">
                Informe um preço válido.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="session-capacity">
              <Form.Label>Capacidade</Form.Label>
              <Form.Control
                type="number"
                min={1}
                step={1}
                required
                value={form.capacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity: e.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">
                Informe a capacidade.
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Excluir sessão</Modal.Title>
        </Modal.Header>
        <Modal.Body>Tem certeza que deseja excluir esta sessão?</Modal.Body>
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
