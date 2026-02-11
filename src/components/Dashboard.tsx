import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Search, ChevronUp, ChevronDown, Leaf, Ruler, Award, Target } from 'lucide-react'
import { ACTION_LABELS, ACTION_COLORS } from '../types'
import { useProspectsContext } from '../contexts/ProspectsContext'

type SortKey = 'score_pertinence' | 'sau_estimee_ha' | 'nom' | 'departement' | 'zone_geographique'

export default function Dashboard() {
  const { prospects, loading, error, refetch } = useProspectsContext()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score_pertinence')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterDept, setFilterDept] = useState('')
  const [filterZone, setFilterZone] = useState('')
  const [filterCert, setFilterCert] = useState(false)
  const [filterScoreMin, setFilterScoreMin] = useState(0)

  const departments = useMemo(
    () => [...new Set(prospects.map((p) => p.departement).filter(Boolean))].sort(),
    [prospects]
  )
  const zones = useMemo(
    () => [...new Set(prospects.map((p) => p.zone_geographique).filter(Boolean))].sort(),
    [prospects]
  )

  const filtered = useMemo(() => {
    return prospects
      .filter((p) => {
        if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.numero_tiers.includes(search)) return false
        if (filterDept && p.departement !== filterDept) return false
        if (filterZone && p.zone_geographique !== filterZone) return false
        if (filterCert && (!p.certifications || p.certifications === '0.0' || p.certifications === '0')) return false
        if (p.score_pertinence < filterScoreMin) return false
        return true
      })
      .sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (av == null && bv == null) return 0
        if (av == null) return sortAsc ? -1 : 1
        if (bv == null) return sortAsc ? 1 : -1
        if (av < bv) return sortAsc ? -1 : 1
        if (av > bv) return sortAsc ? 1 : -1
        return 0
      })
  }, [prospects, search, filterDept, filterZone, filterCert, filterScoreMin, sortKey, sortAsc])

  // KPIs
  const { totalSau, pctCert, avgScore } = useMemo(() => {
    const totalSau = filtered.reduce((s, p) => s + (p.sau_estimee_ha ?? 0), 0)
    const pctCert = filtered.length
      ? Math.round(
          (filtered.filter((p) => p.certifications && p.certifications !== '0.0' && p.certifications !== '0').length /
            filtered.length) *
            100
        )
      : 0
    const avgScore = filtered.length
      ? Math.round(filtered.reduce((s, p) => s + p.score_pertinence, 0) / filtered.length)
      : 0
    return { totalSau, pctCert, avgScore }
  }, [filtered])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function escapeCsv(value: string): string {
    let escaped = value.replace(/"/g, '""')
    if (/^[=+\-@\t\r]/.test(escaped)) escaped = "'" + escaped
    return `"${escaped}"`
  }

  function exportCsv() {
    const header = ['numero_tiers', 'nom', 'ville', 'departement', 'zone', 'sau_ha', 'score', 'statut', 'telephone']
    const rows = filtered.map((p) => [
      p.numero_tiers,
      p.nom,
      p.ville ?? '',
      p.departement ?? '',
      p.zone_geographique ?? '',
      String(p.sau_estimee_ha ?? ''),
      String(p.score_pertinence),
      ACTION_LABELS[p.statut],
      p.telephone_elevage ?? p.telephone_domicile ?? '',
    ])
    const csv = [header.map(h => escapeCsv(h)), ...rows.map(r => r.map(c => escapeCsv(c)))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prospects_bois_bocage.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => refetch()} className="text-sm font-medium text-red-700 hover:text-red-900 underline ml-4">Reessayer</button>
        </div>
      )}
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Target size={20} />} label="Prospects" value={String(filtered.length)} color="text-cooperl-600" />
        <KpiCard icon={<Ruler size={20} />} label="SAU totale" value={`${Math.round(totalSau).toLocaleString('fr-FR')} ha`} color="text-blue-600" />
        <KpiCard icon={<Award size={20} />} label="Certifiés" value={`${pctCert}%`} color="text-amber-600" />
        <KpiCard icon={<Leaf size={20} />} label="Score moyen" value={String(avgScore)} color="text-emerald-600" />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher nom ou n° tiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cooperl-500"
          />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tous depts</option>
          {departments.map((d) => <option key={d} value={d!}>{d}</option>)}
        </select>
        <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes zones</option>
          {zones.map((z) => <option key={z} value={z!}>{z}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={filterCert} onChange={(e) => setFilterCert(e.target.checked)} className="rounded" />
          Certifiés
        </label>
        <select value={filterScoreMin} onChange={(e) => setFilterScoreMin(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
          <option value={0}>Score min</option>
          <option value={50}>50+</option>
          <option value={60}>60+</option>
          <option value={70}>70+</option>
          <option value={80}>80+</option>
        </select>
        <button onClick={exportCsv} className="flex items-center gap-1 px-3 py-2 bg-cooperl-600 text-white rounded-lg text-sm hover:bg-cooperl-700 transition-colors">
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left cursor-pointer select-none" onClick={() => handleSort('nom')}>
                <span className="flex items-center gap-1">Exploitation <SortIcon col="nom" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-left">Ville</th>
              <th className="px-3 py-2 text-center cursor-pointer select-none" onClick={() => handleSort('departement')}>
                <span className="flex items-center justify-center gap-1">Dept <SortIcon col="departement" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-center cursor-pointer select-none" onClick={() => handleSort('zone_geographique')}>
                <span className="flex items-center justify-center gap-1">Zone <SortIcon col="zone_geographique" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => handleSort('sau_estimee_ha')}>
                <span className="flex items-center justify-end gap-1">SAU (ha) <SortIcon col="sau_estimee_ha" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-center cursor-pointer select-none" onClick={() => handleSort('score_pertinence')}>
                <span className="flex items-center justify-center gap-1">Score <SortIcon col="score_pertinence" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-center">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/prospect/${p.id}`)}
                className="hover:bg-cooperl-50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 font-medium">{p.nom}</td>
                <td className="px-3 py-2 text-gray-600">{p.ville}</td>
                <td className="px-3 py-2 text-center">{p.departement}</td>
                <td className="px-3 py-2 text-center">{p.zone_geographique}</td>
                <td className="px-3 py-2 text-right">{p.sau_estimee_ha ? Math.round(p.sau_estimee_ha) : '-'}</td>
                <td className="px-3 py-2 text-center">
                  <ScoreBadge score={p.score_pertinence} />
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_COLORS[p.statut]}`}>
                    {ACTION_LABELS[p.statut]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">Aucun prospect ne correspond aux filtres</div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>
    </div>
  )
}

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return null
  return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{score}</span>
}
