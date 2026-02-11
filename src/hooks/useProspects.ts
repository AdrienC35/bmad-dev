import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect, Action, ProspectWithStatus, ActionType } from '../types'

export function useProspects() {
  const [prospects, setProspects] = useState<ProspectWithStatus[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAll(silent = false, isCancelled?: () => boolean) {
    if (!silent) setLoading(true)
    const [prospectsRes, actionsRes] = await Promise.all([
      supabase.from('prospects').select('*').order('score_pertinence', { ascending: false }),
      supabase.from('actions').select('*').order('created_at', { ascending: false }),
    ])

    if (isCancelled?.()) return

    if (prospectsRes.error) {
      console.error('Failed to fetch prospects:', prospectsRes.error)
      setLoading(false)
      return
    }
    if (actionsRes.error) {
      console.error('Failed to fetch actions:', actionsRes.error)
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

  async function addAction(prospectId: number, type: ActionType, notes?: string, userEmail?: string) {
    const { error } = await supabase.from('actions').insert({
      prospect_id: prospectId,
      type,
      notes: notes ?? null,
      created_by: userEmail ?? null,
    })
    if (!error) await fetchAll(true)
    return error
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      await fetchAll(false, () => cancelled)
    }
    init()
    return () => { cancelled = true }
  }, [])

  return { prospects, actions, loading, refetch: fetchAll, addAction }
}
