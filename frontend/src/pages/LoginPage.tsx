import { useState, type FormEvent } from 'react'
import { Alert, Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await login(username, password)
      if (user.role === 'organizer') navigate('/admin')
      else if (user.role === 'gate') navigate('/portaria')
      else navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="text-center mb-3">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            Início
          </Link>
        </div>
        <div className="login-logo">
          <Link to="/">
            <b>Ingresso</b>
          </Link>
        </div>
        <div className="card login-card">
          <div className="card-body login-card-body">
            <p className="login-box-msg">Entre para continuar</p>
            <p className="small text-muted mb-3">
              Demo: organizador / organizador123 · cliente1 / cliente123 ·
              portaria / portaria123
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <InputGroup.Text>
                  <EnvelopeIcon />
                </InputGroup.Text>
              </InputGroup>
              <InputGroup className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputGroup.Text>
                  <LockIcon />
                </InputGroup.Text>
              </InputGroup>
              <Row className="align-items-center">
                <Col xs={8}>
                  <Form.Check type="checkbox" id="remember" label="Lembrar-me" />
                </Col>
                <Col xs={4}>
                  <Button type="submit" className="w-100" disabled={loading}>
                    {loading ? '...' : 'Entrar'}
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
