import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProspects } from './hooks/useProspects'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import ProspectCard from './components/ProspectCard'
import CampaignTracker from './components/CampaignTracker'

function AuthenticatedApp({ onSignOut, userEmail }: { onSignOut: () => void; userEmail?: string }) {
  const { prospects, actions, loading, addAction } = useProspects()

  return (
    <Layout onSignOut={onSignOut} userEmail={userEmail}>
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

export default function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={signIn} />
  }

  return <AuthenticatedApp onSignOut={signOut} userEmail={user.email} />
}
