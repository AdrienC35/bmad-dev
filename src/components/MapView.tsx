import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { ProspectWithStatus } from '../types'

interface Props {
  prospects: ProspectWithStatus[]
  loading: boolean
}

const iconCache = new Map<string, L.DivIcon>()
function markerIcon(score: number): L.DivIcon {
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  if (!iconCache.has(color)) {
    iconCache.set(color, L.divIcon({
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
    }))
  }
  return iconCache.get(color)!
}

export default function MapView({ prospects, loading }: Props) {
  const navigate = useNavigate()

  const geoProspects = useMemo(
    () => prospects.filter((p) => p.latitude != null && p.longitude != null),
    [prospects]
  )

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{geoProspects.length} prospects géolocalisés</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-600" /> 70+</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> 50-69</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> &lt;50</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <MapContainer center={[48.1, -2.8]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoProspects.map((p) => (
            <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={markerIcon(p.score_pertinence)}>
              <Popup>
                <div className="text-sm space-y-1 min-w-[180px]">
                  <div className="font-bold">{p.nom}</div>
                  <div className="text-gray-600">{p.ville} ({p.departement})</div>
                  <div>SAU: <strong>{p.sau_estimee_ha ? Math.round(p.sau_estimee_ha) : '-'} ha</strong></div>
                  <div>Score: <strong>{p.score_pertinence}</strong></div>
                  {p.telephone_elevage && <div>Tel: {p.telephone_elevage}</div>}
                  {p.telephone_domicile && <div>Tel2: {p.telephone_domicile}</div>}
                  <button
                    onClick={() => navigate(`/prospect/${p.id}`)}
                    className="mt-1 text-xs text-cooperl-600 hover:underline"
                  >
                    Voir la fiche
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
