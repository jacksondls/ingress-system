import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Form, ListGroup, Spinner } from 'react-bootstrap'
import { Html5Qrcode } from 'html5-qrcode'
import { listEvents } from '../api/events'
import { validateGate } from '../api/orders'
import type { Event } from '../types'

export function GatePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [eventId, setEventId] = useState('')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{
    result: string
    detail: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    void listEvents().then((data) => {
      setEvents(data)
      if (data[0]) setEventId(data[0].id)
    })
    return () => {
      void scannerRef.current?.stop().catch(() => undefined)
    }
  }, [])

  async function validate(value: string) {
    if (!eventId || !value.trim()) return
    setError(null)
    try {
      const res = await validateGate(value.trim(), eventId)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na validação')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await validate(code)
  }

  async function toggleScan() {
    if (scanning) {
      await scannerRef.current?.stop().catch(() => undefined)
      scannerRef.current = null
      setScanning(false)
      return
    }
    const scanner = new Html5Qrcode('gate-qr-reader')
    scannerRef.current = scanner
    setScanning(true)
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: 220 },
      (decoded) => {
        setCode(decoded)
        void validate(decoded)
        void scanner.stop().then(() => {
          scannerRef.current = null
          setScanning(false)
        })
      },
      () => undefined,
    )
  }

  const variant =
    result?.result === 'valid'
      ? 'success'
      : result?.result === 'already_used'
        ? 'warning'
        : result?.result === 'wrong_event'
          ? 'info'
          : result
            ? 'danger'
            : undefined

  return (
    <>
      <h1 className="h3 mb-3">Portaria</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {result && variant && (
        <Alert variant={variant}>
          <strong>{result.result}</strong> — {result.detail}
        </Alert>
      )}

      <Form.Group className="mb-3" style={{ maxWidth: 480 }}>
        <Form.Label>Evento</Form.Label>
        {events.length === 0 ? (
          <Spinner size="sm" />
        ) : (
          <Form.Select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Form.Select>
        )}
      </Form.Group>

      <Form onSubmit={handleSubmit} className="mb-3" style={{ maxWidth: 480 }}>
        <Form.Group className="mb-2">
          <Form.Label>Código do ingresso</Form.Label>
          <Form.Control
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cole ou digite o código"
          />
        </Form.Group>
        <Button type="submit" className="me-2">
          Validar
        </Button>
        <Button variant="outline-secondary" type="button" onClick={() => void toggleScan()}>
          {scanning ? 'Parar câmera' : 'Ler QR pela câmera'}
        </Button>
      </Form>

      <div id="gate-qr-reader" style={{ maxWidth: 360 }} />

      <ListGroup className="mt-4" style={{ maxWidth: 480 }}>
        <ListGroup.Item>valid — ingresso ok</ListGroup.Item>
        <ListGroup.Item>invalid — código inválido/forjado</ListGroup.Item>
        <ListGroup.Item>already_used — já utilizado</ListGroup.Item>
        <ListGroup.Item>wrong_event — evento errado</ListGroup.Item>
      </ListGroup>
    </>
  )
}
