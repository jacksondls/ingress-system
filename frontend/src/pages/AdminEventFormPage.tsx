import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createEvent, getEventById, updateEvent } from '../api/events'
import { SessionManager } from '../components/SessionManager'
import type { EventInput, EventType } from '../types'

const empty: EventInput = {
  title: '',
  type: 'show',
  description: '',
  venue: '',
  imageUrl: '',
}

export function AdminEventFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()

  const [form, setForm] = useState<EventInput>(empty)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(id ?? null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void getEventById(id).then((event) => {
      if (cancelled) return
      if (!event) {
        setError('Evento não encontrado.')
        setLoading(false)
        return
      }
      setForm({
        title: event.title,
        type: event.type,
        description: event.description,
        venue: event.venue,
        imageUrl: event.imageUrl ?? '',
      })
      setSavedId(event.id)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const valid =
      form.title.trim().length > 0 &&
      form.venue.trim().length > 0 &&
      form.description.trim().length > 0

    setValidated(true)
    if (!valid) return

    setSaving(true)
    setError(null)

    const payload: EventInput = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      venue: form.venue.trim(),
      imageUrl: form.imageUrl?.trim() || undefined,
    }

    try {
      if (isNew && !savedId) {
        const created = await createEvent(payload)
        setSavedId(created.id)
        navigate(`/admin/eventos/${created.id}`, { replace: true })
      } else if (savedId) {
        await updateEvent(savedId, payload)
      }
    } catch {
      setError('Não foi possível salvar o evento.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Spinner animation="border" role="status" size="sm" />
  }

  return (
    <>
      <Link to="/admin" className="d-inline-block mb-3">
        ← Voltar
      </Link>
      <h1 className="h3 mb-3">{isNew && !savedId ? 'Novo evento' : 'Editar evento'}</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit} className="mb-5">
        <Form.Group className="mb-3" controlId="event-title">
          <Form.Label>Título</Form.Label>
          <Form.Control
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Form.Control.Feedback type="invalid">
            Informe o título.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="event-type">
          <Form.Label>Tipo</Form.Label>
          <Form.Select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as EventType }))
            }
          >
            <option value="show">Show</option>
            <option value="filme">Filme</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="event-venue">
          <Form.Label>Local</Form.Label>
          <Form.Control
            required
            value={form.venue}
            onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          />
          <Form.Control.Feedback type="invalid">
            Informe o local.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="event-description">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            required
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Form.Control.Feedback type="invalid">
            Informe a descrição.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="event-image">
          <Form.Label>URL da imagem (opcional)</Form.Label>
          <Form.Control
            type="url"
            value={form.imageUrl ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, imageUrl: e.target.value }))
            }
          />
        </Form.Group>

        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar evento'}
        </Button>
      </Form>

      {savedId && <SessionManager eventId={savedId} editable />}
    </>
  )
}
