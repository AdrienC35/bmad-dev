import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp, Clock } from 'lucide-react'
import type { ActionType } from '../types'
import { ACTION_LABELS, ACTION_COLORS } from '../types'
import { useProspectsContext } from '../contexts/ProspectsContext'

const OBJECTIF = 40

const STATUT_ORDER: (ActionType | 'en_attente')[] = ['recrute', 'interesse', 'appele', 'rappeler', 'refus', 'en_attente']

export default function CampaignTracker() {
  const { prospects, actions, loading } = useProspectsContext()
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      en_attente: 0, appele: 0, interesse: 0, refus: 0, rappeler: 0, recrute: 0,
    }
    prospects.forEach((p) => { counts[p.statut] = (counts[p.statut] ?? 0) + 1 })
    return counts
  }, [prospects])

  const recrutes = stats.recrute ?? 0
  const pctObjectif = Math.min(100, Math.round((recrutes / OBJECTIF) * 100))

  const prospectMap = useMemo(
    () => new Map(prospects.map((p) => [p.id, p])),
    [prospects]
  )

  const recentActions = useMemo(
    () => actions.slice(0, 20).map((a) => ({
      ...a,
      prospect: prospectMap.get(a.prospect_id),
    })),
    [actions, prospectMap]
  )

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Jauge objectif */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-cooperl-600" />
            <h3 className="font-semibold">Objectif annuel</h3>
          </div>
          <span className="text-2xl font-bold text-cooperl-700">{recrutes} / {OBJECTIF}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cooperl-400 to-cooperl-600"
            style={{ width: `${pctObjectif}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">{pctObjectif}% de l'objectif</div>
      </div>

      {/* Répartition par statut */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-600" />
          <h3 className="font-semibold">Pipeline</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {STATUT_ORDER.map((statut) => (
            <div
              key={statut}
              className="rounded-lg p-3 text-center border"
            >
              <div className="text-2xl font-bold">{stats[statut] ?? 0}</div>
              <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${ACTION_COLORS[statut]}`}>
                {ACTION_LABELS[statut]}
              </div>
            </div>
          ))}
        </div>

        {/* Barre visuelle */}
        <div className="mt-4 flex rounded-full overflow-hidden h-3">
          {STATUT_ORDER.filter((s) => (stats[s] ?? 0) > 0).map((statut) => {
            const pct = prospects.length > 0 ? ((stats[statut] ?? 0) / prospects.length) * 100 : 0
            const colors: Record<string, string> = {
              recrute: 'bg-emerald-500',
              interesse: 'bg-amber-400',
              appele: 'bg-blue-400',
              rappeler: 'bg-purple-400',
              refus: 'bg-red-400',
              en_attente: 'bg-gray-300',
            }
            return (
              <div
                key={statut}
                className={`${colors[statut]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${ACTION_LABELS[statut]}: ${stats[statut]}`}
              />
            )
          })}
        </div>
      </div>

      {/* Historique récent */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-gray-500" />
          <h3 className="font-semibold">Actions récentes</h3>
        </div>

        {recentActions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Aucune action enregistrée. Commencez par appeler des prospects depuis le Pipeline.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActions.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => a.prospect && navigate(`/prospect/${a.prospect.id}`)}
              >
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${ACTION_COLORS[a.type]}`}>
                  {ACTION_LABELS[a.type]}
                </span>
                <span className="font-medium truncate">{a.prospect?.nom ?? `#${a.prospect_id}`}</span>
                <span className="text-gray-400 ml-auto shrink-0">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
