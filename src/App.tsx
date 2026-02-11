import { Routes, Route, Navigate } from 'react-router-dom'
import { useProspects } from './hooks/useProspects'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import ProspectCard from './components/ProspectCard'
import CampaignTracker from './components/CampaignTracker'

export default function App() {
  const { prospects, actions, loading, addAction, refetch } = useProspects()

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={<Dashboard prospects={prospects} loading={loading} />}
        />
        <Route
          path="/carte"
          element={<MapView prospects={prospects} loading={loading} />}
        />
        <Route
          path="/prospect/:id"
          element={
            <ProspectCard
              prospects={prospects}
              actions={actions}
              addAction={addAction}
            />
          }
        />
        <Route
          path="/suivi"
          element={
            <CampaignTracker
              prospects={prospects}
              actions={actions}
              loading={loading}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
