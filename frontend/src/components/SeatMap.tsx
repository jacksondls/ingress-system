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
                const unavailable = seat.status !== 'available'
                const state = unavailable
                  ? 'unavailable'
                  : selected
                    ? 'selected'
                    : 'available'
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={`seat-btn seat-${state}`}
                    disabled={unavailable}
                    onClick={() => {
                      if (unavailable) return
                      onToggle(seat.id)
                    }}
                    title={seat.label}
                    aria-label={seat.label}
                  >
                    {seat.number}
                  </button>
                )
              })}
          </div>
        ))}
      </div>
      <div className="seat-legend">
        <span>
          <i className="seat-dot seat-available" /> Disponível
        </span>
        <span>
          <i className="seat-dot seat-selected" /> Selecionado
        </span>
        <span>
          <i className="seat-dot seat-unavailable" /> Indisponível
        </span>
      </div>
    </div>
  )
}
