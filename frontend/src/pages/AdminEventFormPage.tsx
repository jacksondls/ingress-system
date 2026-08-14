import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Form,
  ListGroup,
  Spinner,
  Stack,
} from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createEvent, getEventById, updateEvent } from '../api/events'
import {
  searchTicketmaster,
  searchTmdb,
  type TicketmasterAttraction,
  type TmdbMovie,
} from '../api/orders'
import { SessionManager } from '../components/SessionManager'
import type { EventInput, EventType } from '../types'
import { STATES } from '../location/states'

const empty: EventInput = {
  title: '',
  type: 'filme',
  description: '',
  venue: '',
  state: 'SP',
  imageUrl: '',
  tmdbId: null,
  ticketmasterId: '',
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
  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbMovie[]>([])
  const [tmdbBusy, setTmdbBusy] = useState(false)
  const [tmQuery, setTmQuery] = useState('')
  const [tmResults, setTmResults] = useState<TicketmasterAttraction[]>([])
  const [tmBusy, setTmBusy] = useState(false)

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
        state: event.state || 'SP',
        imageUrl: event.imageUrl ?? '',
        tmdbId: event.tmdbId ?? null,
        ticketmasterId: event.ticketmasterId ?? '',
      })
      setSavedId(event.id)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleTmdbSearch() {
    setTmdbBusy(true)
    setError(null)
    try {
      const results = await searchTmdb(tmdbQuery)
      setTmdbResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha TMDb')
    } finally {
      setTmdbBusy(false)
    }
  }

  function applyTmdb(movie: TmdbMovie) {
    setForm((f) => ({
      ...f,
      type: 'filme',
      title: movie.title,
      description: movie.overview || f.description,
      imageUrl: movie.imageUrl || f.imageUrl,
      tmdbId: movie.tmdbId,
      ticketmasterId: '',
    }))
  }

  async function handleTmSearch() {
    setTmBusy(true)
    setError(null)
    try {
      const results = await searchTicketmaster(tmQuery)
      setTmResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha Ticketmaster')
    } finally {
      setTmBusy(false)
    }
  }

  function applyTicketmaster(item: TicketmasterAttraction) {
    setForm((f) => ({
      ...f,
      type: 'show',
      title: item.title,
      description: item.overview || f.description,
      imageUrl: item.imageUrl || f.imageUrl,
      ticketmasterId: item.ticketmasterId,
      tmdbId: null,
    }))
  }

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
      state: form.state,
      imageUrl: form.imageUrl?.trim() || undefined,
      tmdbId: form.tmdbId ?? null,
      ticketmasterId: form.ticketmasterId?.trim() || undefined,
    }

    try {
      if (isNew && !savedId) {
        const created = await createEvent(payload)
        setSavedId(created.id)
        navigate(`/admin/eventos/${created.id}`, { replace: true })
      } else if (savedId) {
        await updateEvent(savedId, payload)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Spinner animation="border" role="status" size="sm" />
  }

  return (
    <>
      <Link to="/admin" className="d-inline-block mb-3 text-decoration-none">
        ← Voltar
      </Link>
      <h1 className="h3 mb-3">
        {isNew && !savedId ? 'Novo evento' : 'Editar evento'}
      </h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="mb-4 p-3 surface-card">
        <h2 className="h6">Buscar filme no TMDb</h2>
        <Stack direction="horizontal" gap={2} className="mb-2">
          <Form.Control
            placeholder="Ex.: Duna"
            value={tmdbQuery}
            onChange={(e) => setTmdbQuery(e.target.value)}
          />
          <Button
            variant="outline-primary"
            disabled={tmdbBusy || !tmdbQuery.trim()}
            onClick={() => void handleTmdbSearch()}
          >
            {tmdbBusy ? '...' : 'Buscar'}
          </Button>
        </Stack>
        {tmdbResults.length > 0 && (
          <ListGroup>
            {tmdbResults.map((movie) => (
              <ListGroup.Item
                key={movie.tmdbId}
                action
                onClick={() => applyTmdb(movie)}
              >
                <div className="fw-semibold">{movie.title}</div>
                <small className="text-muted">{movie.releaseDate}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <div className="mb-4 p-3 surface-card">
        <h2 className="h6">Buscar show no Ticketmaster</h2>
        <Stack direction="horizontal" gap={2} className="mb-2">
          <Form.Control
            placeholder="Ex.: Arctic Monkeys"
            value={tmQuery}
            onChange={(e) => setTmQuery(e.target.value)}
          />
          <Button
            variant="outline-primary"
            disabled={tmBusy || !tmQuery.trim()}
            onClick={() => void handleTmSearch()}
          >
            {tmBusy ? '...' : 'Buscar'}
          </Button>
        </Stack>
        {tmResults.length > 0 && (
          <ListGroup>
            {tmResults.map((item) => (
              <ListGroup.Item
                key={item.ticketmasterId}
                action
                onClick={() => applyTicketmaster(item)}
              >
                <div className="fw-semibold">{item.title}</div>
                <small className="text-muted">{item.overview}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>

      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
        className="mb-5 surface-card p-3 p-md-4"
      >
        <Form.Group className="mb-3" controlId="event-title">
          <Form.Label>Título</Form.Label>
          <Form.Control
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
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
        </Form.Group>

        <Form.Group className="mb-3" controlId="event-state">
          <Form.Label>Estado</Form.Label>
          <Form.Select
            required
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          >
            {STATES.map((item) => (
              <option key={item.uf} value={item.uf}>
                {item.uf} — {item.name}
              </option>
            ))}
          </Form.Select>
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
