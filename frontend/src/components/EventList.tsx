import { Link } from 'react-router-dom'
import type { Event, Session } from '../types'

type Props = {
  events: Event[]
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

function sessionLine(session: Session) {
  const room = session.room ? ` · ${session.room}` : ''
  const available = session.available ?? session.capacity
  return `${formatDateTime(session.datetime)}${room} · ${formatPrice(session.price)} · ${available} vagas`
}

export function EventList({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        <p className="mb-0">Nenhum evento encontrado.</p>
      </div>
    )
  }

  return (
    <section>
      <h2 className="h4 mb-3">Em cartaz</h2>
      <div className="event-strip">
        {events.map((event) => {
          const sessions = event.sessions ?? []
          return (
            <Link
              key={event.id}
              to={`/evento/${event.id}`}
              className="event-poster-card text-decoration-none"
            >
              <div
                className="event-poster-cover"
                style={
                  event.imageUrl
                    ? { backgroundImage: `url(${event.imageUrl})` }
                    : undefined
                }
              >
                <div className="event-poster-overlay">
                  <p className="mb-2">{event.description}</p>
                  {sessions.length === 0 ? (
                    <p className="small mb-0">Nenhuma sessão.</p>
                  ) : (
                    <ul className="mb-0 ps-3">
                      {sessions.map((session) => (
                        <li key={session.id}>{sessionLine(session)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <h3 className="event-poster-title">{event.title}</h3>
              <p className="event-poster-venue">{event.venue}</p>
              {sessions[0] && (
                <p className="event-poster-meta">
                  {formatDateTime(sessions[0].datetime)} ·{' '}
                  {formatPrice(sessions[0].price)}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
