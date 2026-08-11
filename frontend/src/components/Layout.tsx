import { Button, Container, Nav, Navbar } from 'react-bootstrap'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="md" className="mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            Eventos
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/" end>
                Explorar
              </Nav.Link>
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
            <Nav>
              {user ? (
                <>
                  <Navbar.Text className="me-3">
                    {user.username} ({user.role})
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
      <Container className="pb-5">
        <Outlet />
      </Container>
    </>
  )
}
