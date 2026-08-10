import { Button, ButtonGroup, Form } from 'react-bootstrap'
import type { EventType } from '../types'

type FilterType = EventType | 'all'

type Props = {
  query: string
  type: FilterType
  onQueryChange: (value: string) => void
  onTypeChange: (value: FilterType) => void
}

export function SearchBar({ query, type, onQueryChange, onTypeChange }: Props) {
  return (
    <div className="d-flex flex-column flex-md-row gap-3 mb-4">
      <Form.Control
        type="search"
        placeholder="Buscar por título ou local..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <ButtonGroup>
        <Button
          variant={type === 'all' ? 'primary' : 'outline-primary'}
          onClick={() => onTypeChange('all')}
        >
          Todos
        </Button>
        <Button
          variant={type === 'show' ? 'primary' : 'outline-primary'}
          onClick={() => onTypeChange('show')}
        >
          Shows
        </Button>
        <Button
          variant={type === 'filme' ? 'primary' : 'outline-primary'}
          onClick={() => onTypeChange('filme')}
        >
          Filmes
        </Button>
      </ButtonGroup>
    </div>
  )
}
