import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { listEvents } from '../api/events'
import { EventList } from '../components/EventList'
import { SearchBar } from '../components/SearchBar'
import type { Event, EventType } from '../types'

type FilterType = EventType | 'all'

export function ExplorePage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<FilterType>('all')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listEvents({ query, type }).then((data) => {
      if (!cancelled) {
        setEvents(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, type])

  return (
    <>
      <h1 className="h3 mb-3">Explorar eventos</h1>
      <SearchBar
        query={query}
        type={type}
        onQueryChange={setQuery}
        onTypeChange={setType}
      />
      {loading ? (
        <Spinner animation="border" role="status" size="sm" />
      ) : (
        <EventList events={events} />
      )}
    </>
  )
}
