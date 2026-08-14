import { useEffect, useMemo, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { listEvents } from '../api/events'
import { EventHero } from '../components/EventHero'
import { EventList } from '../components/EventList'
import {
  SearchBar,
  type FilterType,
  type SortBy,
  type SortOrder,
} from '../components/SearchBar'
import { useStateFilter } from '../location/StateFilter'
import type { Event } from '../types'

function eventDate(event: Event) {
  const first = event.sessions?.[0]?.datetime
  return new Date(first || event.createdAt).getTime()
}

function pickFeatured(events: Event[]): Event | null {
  const withSessions = events.filter((e) => (e.sessions?.length ?? 0) > 0)
  const films = withSessions.filter((e) => e.type === 'filme')
  const pool = films.length ? films : withSessions.length ? withSessions : events
  if (pool.length === 0) return null
  return [...pool].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]
}

export function ExplorePage() {
  const { state } = useStateFilter()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('title')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listEvents({ query, type, state }).then((data) => {
      if (!cancelled) {
        setEvents(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, type, state])

  const sorted = useMemo(() => {
    const copy = [...events]
    copy.sort((a, b) => {
      const cmp =
        sortBy === 'title'
          ? a.title.localeCompare(b.title, 'pt-BR')
          : eventDate(a) - eventDate(b)
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return copy
  }, [events, sortBy, sortOrder])

  const showHero = !query.trim() && type === 'all'
  const featured = showHero ? pickFeatured(events) : null

  return (
    <>
      {!loading && featured && <EventHero event={featured} />}
      <SearchBar
        query={query}
        type={type}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearch={setQuery}
        onTypeChange={setType}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />
      {loading ? (
        <div className="page-spinner">
          <Spinner animation="border" role="status" />
        </div>
      ) : (
        <EventList events={sorted} />
      )}
    </>
  )
}
