import { createContext, useContext, type ReactNode } from 'react'
import { useProspects } from '../hooks/useProspects'
import type { ProspectWithStatus, Action, ActionType } from '../types'

interface ProspectsContextValue {
  prospects: ProspectWithStatus[]
  actions: Action[]
  loading: boolean
  error: string | null
  refetch: (silent?: boolean) => Promise<void>
  addAction: (prospectId: number, type: ActionType, notes?: string) => Promise<unknown>
}

const ProspectsContext = createContext<ProspectsContextValue | null>(null)

export function ProspectsProvider({ children }: { children: ReactNode }) {
  const value = useProspects()
  return <ProspectsContext.Provider value={value}>{children}</ProspectsContext.Provider>
}

export function useProspectsContext(): ProspectsContextValue {
  const ctx = useContext(ProspectsContext)
  if (!ctx) throw new Error('useProspectsContext must be used within ProspectsProvider')
  return ctx
}
