import { Link } from 'react-router-dom'
import type { Event } from '../types'

type Props = {
  event: Event
}

export function EventHero({ event }: Props) {
  const excerpt =
    event.description.length > 180
      ? `${event.description.slice(0, 180).trim()}…`
      : event.description

  return (
    <section className="event-hero">
      <div className="event-hero-inner">
        {event.imageUrl ? (
          <img
            className="event-hero-poster"
            src={event.imageUrl}
            alt=""
          />
        ) : (
          <div className="event-hero-poster" />
        )}
        <div className="event-hero-copy">
          <p className="event-hero-kicker">Lançamento em cartaz</p>
          <h1 className="event-hero-title">{event.title}</h1>
          <p className="event-hero-venue">{event.venue}</p>
          <p className="event-hero-desc">{excerpt}</p>
          <Link to={`/evento/${event.id}`} className="btn btn-primary session-card-buy">
            Comprar ingresso
          </Link>
        </div>
      </div>
    </section>
  )
}
