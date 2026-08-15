export function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatSessionDateTime(iso: string) {
  return `${formatSessionDate(iso)} ${formatSessionTime(iso)}`
}

export function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatQuantity(value: number) {
  return value.toLocaleString('pt-BR')
}

export const HOLD_MS = 10 * 60 * 1000

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const ORDER_STATUS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Recusado',
  cancelled: 'Cancelado',
}

export function formatOrderStatus(status: string) {
  return ORDER_STATUS[status] ?? status
}

const TICKET_STATUS: Record<string, string> = {
  valid: 'Válido',
  used: 'Utilizado',
}

export function formatTicketStatus(status: string) {
  return TICKET_STATUS[status] ?? status
}

const GATE_RESULT: Record<string, string> = {
  valid: 'Ingresso válido',
  invalid: 'Código inválido',
  already_used: 'Já utilizado',
  wrong_event: 'Evento errado',
}

export function formatGateResult(result: string) {
  return GATE_RESULT[result] ?? result
}
