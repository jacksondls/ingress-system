import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STATES, type StateUF } from './states'

const STORAGE_KEY = 'ingresso_state_v2'

export type StateFilterUF = StateUF | ''

function readStored(): StateFilterUF {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw && STATES.some((s) => s.uf === raw)) return raw as StateUF
  return ''
}

type StateFilterValue = {
  state: StateFilterUF
  setState: (uf: StateFilterUF) => void
}

const StateFilterContext = createContext<StateFilterValue | null>(null)

export function StateFilterProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<StateFilterUF>(readStored)

  const value = useMemo<StateFilterValue>(
    () => ({
      state,
      setState(uf) {
        localStorage.setItem(STORAGE_KEY, uf)
        setStateRaw(uf)
      },
    }),
    [state],
  )

  return (
    <StateFilterContext.Provider value={value}>
      {children}
    </StateFilterContext.Provider>
  )
}

export function useStateFilter() {
  const ctx = useContext(StateFilterContext)
  if (!ctx) throw new Error('useStateFilter fora do StateFilterProvider')
  return ctx
}
