import { Badge, ListGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Event } from '../types'

type Props = {
  events: Event[]
}

function typeLabel(type: Event['type']) {
  return type === 'show' ? 'Show' : 'Filme'
}

export function EventList({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-muted">Nenhum evento encontrado.</p>
  }

  return (
    <ListGroup>
      {events.map((event) => (
        <ListGroup.Item
          key={event.id}
          action
          as={Link}
          to={`/evento/${event.id}`}
          className="d-flex justify-content-between align-items-start"
        >
          <div>
            <div className="fw-semibold">{event.title}</div>
            <small className="text-muted">{event.venue}</small>
          </div>
          <Badge bg={event.type === 'show' ? 'info' : 'secondary'} pill>
            {typeLabel(event.type)}
          </Badge>
        </ListGroup.Item>
      ))}
    </ListGroup>
  )
}
