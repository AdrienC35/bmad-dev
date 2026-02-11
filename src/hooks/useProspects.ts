import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Prospect, Action, ProspectWithStatus, ActionType } from '../types'

const PROSPECT_COLUMNS = 'id,numero_tiers,civilite,nom,rue,code_postal,ville,departement,zone_geographique,telephone_domicile,telephone_elevage,adresse_email,sau_estimee_ha,source_sau,sau_contrats_ha,sau_tonnages_ha,tonnage_total,certifications,latitude,longitude,annee_fidelite,score_pertinence,tc_referent'
const ACTION_COLUMNS = 'id,prospect_id,type,notes,created_at,created_by'

export function useProspects() {
  const [prospects, setProspects] = useState<ProspectWithStatus[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAll = useCallback(async (silent = false) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!silent) setLoading(true)
    const [prospectsRes, actionsRes] = await Promise.all([
      supabase.from('prospects').select(PROSPECT_COLUMNS).order('score_pertinence', { ascending: false }).abortSignal(controller.signal),
      supabase.from('actions').select(ACTION_COLUMNS).order('created_at', { ascending: false }).limit(1000).abortSignal(controller.signal),
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
  }, [])

  const addAction = useCallback(async (prospectId: number, type: ActionType, notes?: string) => {
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
  }, [fetchAll])

  useEffect(() => {
    fetchAll()
    return () => { abortRef.current?.abort() }
  }, [fetchAll])

  return { prospects, actions, loading, refetch: fetchAll, addAction }
}
