import { useState, type FormEvent } from 'react'
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import type { EventType } from '../types'

export type FilterType = EventType | 'all'
export type SortBy = 'title' | 'date'
export type SortOrder = 'asc' | 'desc'

type Props = {
  query: string
  type: FilterType
  sortBy: SortBy
  sortOrder: SortOrder
  onSearch: (query: string) => void
  onTypeChange: (value: FilterType) => void
  onSortByChange: (value: SortBy) => void
  onSortOrderChange: (value: SortOrder) => void
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SearchBar({
  query,
  type,
  sortBy,
  sortOrder,
  onSearch,
  onTypeChange,
  onSortByChange,
  onSortOrderChange,
}: Props) {
  const [draft, setDraft] = useState(query)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSearch(draft)
  }

  return (
    <div className="search-card mb-4">
      <div className="search-card-header">Busca</div>
      <div className="search-card-body">
        <Form onSubmit={handleSubmit}>
          <InputGroup size="lg" className="mb-3">
            <Form.Control
              type="search"
              placeholder="Buscar por título ou local..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" variant="outline-secondary" aria-label="Buscar">
              <SearchIcon />
            </Button>
          </InputGroup>
          <Row className="g-3">
            <Col md={4}>
              <div className="fw-semibold mb-2">Tipo:</div>
              <Form.Check
                type="radio"
                id="type-all"
                name="type"
                label="Todos"
                checked={type === 'all'}
                onChange={() => onTypeChange('all')}
              />
              <Form.Check
                type="radio"
                id="type-show"
                name="type"
                label="Shows"
                checked={type === 'show'}
                onChange={() => onTypeChange('show')}
              />
              <Form.Check
                type="radio"
                id="type-filme"
                name="type"
                label="Filmes"
                checked={type === 'filme'}
                onChange={() => onTypeChange('filme')}
              />
            </Col>
            <Col md={4}>
              <div className="fw-semibold mb-2">Ordenar por:</div>
              <Form.Check
                type="radio"
                id="sort-title"
                name="sortBy"
                label="Título"
                checked={sortBy === 'title'}
                onChange={() => onSortByChange('title')}
              />
              <Form.Check
                type="radio"
                id="sort-date"
                name="sortBy"
                label="Data"
                checked={sortBy === 'date'}
                onChange={() => onSortByChange('date')}
              />
            </Col>
            <Col md={4}>
              <div className="fw-semibold mb-2">Ordem:</div>
              <Form.Check
                type="radio"
                id="order-asc"
                name="sortOrder"
                label="Crescente"
                checked={sortOrder === 'asc'}
                onChange={() => onSortOrderChange('asc')}
              />
              <Form.Check
                type="radio"
                id="order-desc"
                name="sortOrder"
                label="Decrescente"
                checked={sortOrder === 'desc'}
                onChange={() => onSortOrderChange('desc')}
              />
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  )
}
