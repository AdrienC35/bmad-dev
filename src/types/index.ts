export interface Prospect {
  id: number
  numero_tiers: string
  civilite: string | null
  nom: string
  rue: string | null
  code_postal: string | null
  ville: string | null
  departement: string | null
  zone_geographique: string | null
  telephone_domicile: string | null
  telephone_elevage: string | null
  adresse_email: string | null
  sau_estimee_ha: number | null
  source_sau: string | null
  sau_contrats_ha: number | null
  sau_tonnages_ha: number | null
  tonnage_total: number | null
  certifications: string | null
  latitude: number | null
  longitude: number | null
  annee_fidelite: number | null
  score_pertinence: number
  tc_referent: string | null
}

export type ActionType = 'appele' | 'interesse' | 'refus' | 'rappeler' | 'recrute'

export interface Action {
  id: number
  prospect_id: number
  type: ActionType
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface ProspectWithStatus extends Prospect {
  statut: ActionType | 'en_attente'
  derniere_action: Action | null
}

export const ACTION_LABELS: Record<ActionType | 'en_attente', string> = {
  en_attente: 'En attente',
  appele: 'Appelé',
  interesse: 'Intéressé',
  refus: 'Refus',
  rappeler: 'À rappeler',
  recrute: 'Recruté',
}

export const ACTION_COLORS: Record<ActionType | 'en_attente', string> = {
  en_attente: 'bg-gray-100 text-gray-700',
  appele: 'bg-blue-100 text-blue-700',
  interesse: 'bg-amber-100 text-amber-700',
  refus: 'bg-red-100 text-red-700',
  rappeler: 'bg-purple-100 text-purple-700',
  recrute: 'bg-emerald-100 text-emerald-700',
}

export interface ScoreCriterion {
  label: string
  points: number
  max: number
  met: boolean
}

export function decomposeScore(p: Prospect): ScoreCriterion[] {
  const sau = p.sau_estimee_ha ?? 0
  const tonnage = p.tonnage_total ?? 0
  const cert = p.certifications !== null && p.certifications !== '' && p.certifications !== '0.0' && p.certifications !== '0'
  const fidelite = p.annee_fidelite ?? 0

  return [
    { label: 'SAU > 0 ha', points: sau > 0 ? 30 : 0, max: 30, met: sau > 0 },
    { label: 'SAU > 50 ha', points: sau > 50 ? 20 : 0, max: 20, met: sau > 50 },
    { label: 'Certifié HVE/Bio', points: cert ? 15 : 0, max: 15, met: cert },
    { label: 'Tonnage > 100t', points: tonnage > 100 ? 10 : 0, max: 10, met: tonnage > 100 },
    { label: 'Fidélité >= 3 ans', points: fidelite >= 3 ? 10 : 0, max: 10, met: fidelite >= 3 },
  ]
}
