import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, TreePine } from 'lucide-react'
import type { ProspectWithStatus, Action, ActionType } from '../types'
import { ACTION_LABELS, ACTION_COLORS, decomposeScore } from '../types'

interface Props {
  prospects: ProspectWithStatus[]
  actions: Action[]
  addAction: (prospectId: number, type: ActionType, notes?: string) => Promise<unknown>
}

const ACTION_BUTTONS: { type: ActionType; label: string; className: string }[] = [
  { type: 'appele', label: 'Appelé', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { type: 'interesse', label: 'Intéressé', className: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'rappeler', label: 'Rappeler', className: 'bg-purple-500 hover:bg-purple-600 text-white' },
  { type: 'refus', label: 'Refus', className: 'bg-red-500 hover:bg-red-600 text-white' },
  { type: 'recrute', label: 'Recruté', className: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
]

export default function ProspectCard({ prospects, actions, addAction }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()

  const prospect = prospects.find((p) => p.id === Number(id))
  const prospectActions = useMemo(
    () => actions.filter((a) => a.prospect_id === Number(id)),
    [actions, id]
  )

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Prospect non trouvé</p>
        <button onClick={() => navigate('/')} className="mt-2 text-cooperl-600 hover:underline">Retour</button>
      </div>
    )
  }

  const breakdown = decomposeScore(prospect)
  const breakdownTotal = breakdown.reduce((s, c) => s + c.points, 0)

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TreePine size={20} className="text-cooperl-600" />
              {prospect.civilite && <span className="text-gray-500 font-normal">{prospect.civilite}</span>}
              {prospect.nom}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">N° {prospect.numero_tiers} | Zone {prospect.zone_geographique}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${ACTION_COLORS[prospect.statut]}`}>
            {ACTION_LABELS[prospect.statut]}
          </span>
        </div>

        {/* Coordonnées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              {prospect.rue && <div>{prospect.rue}</div>}
              <div>{prospect.code_postal} {prospect.ville}</div>
              <div className="text-gray-500">Dept {prospect.departement}</div>
            </div>
          </div>
          <div className="space-y-1">
            {prospect.telephone_elevage && (
              <a href={`tel:${prospect.telephone_elevage}`} className="flex items-center gap-2 text-cooperl-600 hover:underline">
                <Phone size={14} /> {prospect.telephone_elevage} <span className="text-gray-400">(élevage)</span>
              </a>
            )}
            {prospect.telephone_domicile && (
              <a href={`tel:${prospect.telephone_domicile}`} className="flex items-center gap-2 text-cooperl-600 hover:underline">
                <Phone size={14} /> {prospect.telephone_domicile} <span className="text-gray-400">(domicile)</span>
              </a>
            )}
            {prospect.adresse_email && (
              <a href={`mailto:${prospect.adresse_email}`} className="flex items-center gap-2 text-cooperl-600 hover:underline">
                <Mail size={14} /> {prospect.adresse_email}
              </a>
            )}
          </div>
        </div>

        {/* Données exploitation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3 text-sm">
          <div>
            <div className="text-gray-500">SAU estimée</div>
            <div className="font-bold">{prospect.sau_estimee_ha ? `${Math.round(prospect.sau_estimee_ha)} ha` : '-'}</div>
            <div className="text-xs text-gray-400">via {prospect.source_sau}</div>
          </div>
          <div>
            <div className="text-gray-500">Tonnage</div>
            <div className="font-bold">{prospect.tonnage_total ? `${Math.round(prospect.tonnage_total)} t` : '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Certifications</div>
            <div className="font-bold">{prospect.certifications && prospect.certifications !== '0.0' && prospect.certifications !== '0' ? 'Oui' : 'Non'}</div>
          </div>
          <div>
            <div className="text-gray-500">Fidélité</div>
            <div className="font-bold">{prospect.annee_fidelite ? `${Math.round(prospect.annee_fidelite)} ans` : '-'}</div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="bg-white rounded-lg shadow p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Score de pertinence</h3>
          <span className="text-2xl font-bold text-cooperl-700">{prospect.score_pertinence}</span>
        </div>
        <div className="space-y-2">
          {breakdown.map((c) => (
            <div key={c.label} className="flex items-center gap-3 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${c.met ? 'bg-cooperl-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {c.met ? '\u2713' : ''}
              </div>
              <div className="flex-1">{c.label}</div>
              <div className="font-mono text-right w-16">{c.points} / {c.max}</div>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold text-sm">
            <span>Total calculé</span>
            <span className="font-mono">{breakdownTotal} / 85</span>
          </div>
          {breakdownTotal !== prospect.score_pertinence && (
            <div className="text-xs text-amber-600">
              Ecart de {prospect.score_pertinence - breakdownTotal} pts (critères supplémentaires non décomposés)
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-5 space-y-3">
        <h3 className="font-semibold">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {ACTION_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              onClick={() => addAction(prospect.id, btn.type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Historique */}
        {prospectActions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm text-gray-500">Historique</h4>
            {prospectActions.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm py-1 border-b border-gray-100 last:border-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_COLORS[a.type]}`}>
                  {ACTION_LABELS[a.type]}
                </span>
                <span className="text-gray-400">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {a.notes && <span className="text-gray-600">{a.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
