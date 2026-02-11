import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect, Action, ProspectWithStatus, ActionType } from '../types'

export function useProspects() {
  const [prospects, setProspects] = useState<ProspectWithStatus[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchAll(silent = false) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!silent) setLoading(true)
    const [prospectsRes, actionsRes] = await Promise.all([
      supabase.from('prospects').select('*').order('score_pertinence', { ascending: false }).abortSignal(controller.signal),
      supabase.from('actions').select('*').order('created_at', { ascending: false }).limit(1000).abortSignal(controller.signal),
    ])

    if (controller.signal.aborted) return

    if (prospectsRes.error) {
      console.error('Failed to fetch prospects:', prospectsRes.error)
      setLoading(false)
      return
    }
    if (actionsRes.error) {
      console.error('Failed to fetch actions:', actionsRes.error)
      setLoading(false)
      return
    }

    const prospectsList = (prospectsRes.data ?? []) as Prospect[]
    const actionsList = (actionsRes.data ?? []) as Action[]
    setActions(actionsList)

    const actionsByProspect = new Map<number, Action[]>()
    actionsList.forEach((a) => {
      const arr = actionsByProspect.get(a.prospect_id) ?? []
      arr.push(a)
      actionsByProspect.set(a.prospect_id, arr)
    })

    const enriched: ProspectWithStatus[] = prospectsList.map((p) => {
      const derniere = (actionsByProspect.get(p.id) ?? [])[0] ?? null
      return {
        ...p,
        statut: derniere ? derniere.type : ('en_attente' as const),
        derniere_action: derniere,
      }
    })

    setProspects(enriched)
    setLoading(false)
  }

  async function addAction(prospectId: number, type: ActionType, notes?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const email = session?.user?.email ?? null
    const { error } = await supabase.from('actions').insert({
      prospect_id: prospectId,
      type,
      notes: notes ?? null,
      created_by: email,
    })
    if (!error) await fetchAll(true)
    return error
  }

  useEffect(() => {
    fetchAll()
    return () => { abortRef.current?.abort() }
  }, [])

  return { prospects, actions, loading, refetch: fetchAll, addAction }
}
