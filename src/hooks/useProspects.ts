import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect, Action, ProspectWithStatus, ActionType } from '../types'

export function useProspects() {
  const [prospects, setProspects] = useState<ProspectWithStatus[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const [{ data: pData }, { data: aData }] = await Promise.all([
      supabase.from('prospects').select('*').order('score_pertinence', { ascending: false }),
      supabase.from('actions').select('*').order('created_at', { ascending: false }),
    ])

    const prospectsList = (pData ?? []) as Prospect[]
    const actionsList = (aData ?? []) as Action[]
    setActions(actionsList)

    const enriched: ProspectWithStatus[] = prospectsList.map((p) => {
      const prospectActions = actionsList.filter((a) => a.prospect_id === p.id)
      const derniere = prospectActions[0] ?? null
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
    const { error } = await supabase.from('actions').insert({
      prospect_id: prospectId,
      type,
      notes: notes ?? null,
    })
    if (!error) await fetchAll()
    return error
  }

  useEffect(() => {
    fetchAll()
  }, [])

  return { prospects, actions, loading, refetch: fetchAll, addAction }
}
