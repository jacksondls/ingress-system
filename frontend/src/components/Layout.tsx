import { Button, Container, Form, Nav, Navbar } from 'react-bootstrap'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useStateFilter } from '../location/StateFilter'
import { STATES, type StateUF } from '../location/states'

const roleLabel: Record<string, string> = {
  organizer: 'Organizador',
  client: 'Cliente',
  gate: 'Portaria',
}

export function Layout() {
  const { user, logout } = useAuth()
  const { state, setState } = useStateFilter()

  return (
    <div className="app-shell">
      <Navbar expand="md" variant="dark" className="app-navbar mb-4" sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            <span className="brand-mark">I</span>
            Ingresso
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto align-items-md-center gap-2">
              <Nav.Link as={NavLink} to="/" end>
                Explorar
              </Nav.Link>
              <Form.Select
                size="sm"
                className="state-select"
                aria-label="Estado"
                value={state}
                onChange={(e) => setState(e.target.value as StateUF)}
              >
                {STATES.map((item) => (
                  <option key={item.uf} value={item.uf}>
                    {item.uf} — {item.name}
                  </option>
                ))}
              </Form.Select>
              {user?.role === 'organizer' && (
                <Nav.Link as={NavLink} to="/admin">
                  Gerenciar
                </Nav.Link>
              )}
              {user?.role === 'client' && (
                <Nav.Link as={NavLink} to="/meus-ingressos">
                  Meus ingressos
                </Nav.Link>
              )}
              {user?.role === 'gate' && (
                <Nav.Link as={NavLink} to="/portaria">
                  Portaria
                </Nav.Link>
              )}
            </Nav>
            <Nav className="align-items-md-center gap-2">
              {user ? (
                <>
                  <Navbar.Text className="me-md-2">
                    {user.username}
                    {user.role && (
                      <span className="opacity-75">
                        {' '}
                        · {roleLabel[user.role]}
                      </span>
                    )}
                  </Navbar.Text>
                  <Button size="sm" variant="outline-light" onClick={logout}>
                    Sair
                  </Button>
                </>
              ) : (
                <Nav.Link as={NavLink} to="/login">
                  Entrar
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="app-main">
        <Outlet />
      </Container>
      <footer className="app-footer">
        <Container>
          <div className="footer-nav">
            <div>
              <h2 className="footer-title">Explorar</h2>
              <Nav className="flex-column">
                <Nav.Link as={NavLink} to="/" end>
                  Início
                </Nav.Link>
              </Nav>
            </div>
            <div>
              <h2 className="footer-title">Conta</h2>
              <Nav className="flex-column">
                {user ? (
                  <button type="button" className="footer-link" onClick={logout}>
                    Sair
                  </button>
                ) : (
                  <Nav.Link as={NavLink} to="/login">
                    Entrar
                  </Nav.Link>
                )}
              </Nav>
            </div>
            <div>
              <h2 className="footer-title">Atalhos</h2>
              <Nav className="flex-column">
                {user?.role === 'organizer' && (
                  <Nav.Link as={NavLink} to="/admin">
                    Gerenciar
                  </Nav.Link>
                )}
                {user?.role === 'client' && (
                  <Nav.Link as={NavLink} to="/meus-ingressos">
                    Meus ingressos
                  </Nav.Link>
                )}
                {user?.role === 'gate' && (
                  <Nav.Link as={NavLink} to="/portaria">
                    Portaria
                  </Nav.Link>
                )}
                {!user && (
                  <span className="footer-hint">Entre para ver atalhos</span>
                )}
              </Nav>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
