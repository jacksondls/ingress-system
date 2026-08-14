import { Button } from 'react-bootstrap'
import type { Seat } from '../types'

type Props = {
  seats: Seat[]
  selectedIds: string[]
  onToggle: (seatId: string) => void
}

export function SeatMap({ seats, selectedIds, onToggle }: Props) {
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort()

  return (
    <div className="mb-3">
      <div className="seat-screen" />
      <p className="text-center text-muted small mb-3">Tela</p>
      <div className="d-flex flex-column gap-2 align-items-center">
        {rows.map((row) => (
          <div key={row} className="d-flex gap-1 align-items-center">
            <span className="small text-muted" style={{ width: 16 }}>
              {row}
            </span>
            {seats
              .filter((s) => s.row === row)
              .sort((a, b) => a.number - b.number)
              .map((seat) => {
                const selected = selectedIds.includes(seat.id)
                const taken = seat.status !== 'available'
                return (
                  <Button
                    key={seat.id}
                    size="sm"
                    className="seat-btn"
                    disabled={taken}
                    variant={
                      taken
                        ? 'secondary'
                        : selected
                          ? 'primary'
                          : 'outline-primary'
                    }
                    onClick={() => onToggle(seat.id)}
                    title={seat.label}
                  >
                    {seat.number}
                  </Button>
                )
              })}
          </div>
        ))}
      </div>
      <div className="d-flex gap-3 justify-content-center mt-3 small text-muted">
        <span>Livre</span>
        <span>Selecionado</span>
        <span>Indisponível</span>
      </div>
    </div>
  )
}
