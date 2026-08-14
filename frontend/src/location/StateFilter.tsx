import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STATES, type StateUF } from './states'

const STORAGE_KEY = 'ingresso_state'

function readStored(): StateUF {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw && STATES.some((s) => s.uf === raw)) return raw as StateUF
  return 'SP'
}

type StateFilterValue = {
  state: StateUF
  setState: (uf: StateUF) => void
}

const StateFilterContext = createContext<StateFilterValue | null>(null)

export function StateFilterProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<StateUF>(readStored)

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
