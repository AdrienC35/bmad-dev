import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ProspectsProvider } from './contexts/ProspectsContext'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import ProspectCard from './components/ProspectCard'
import CampaignTracker from './components/CampaignTracker'
import Limitations from './components/Limitations'

function AuthenticatedApp({ onSignOut, userEmail }: { onSignOut: () => void; userEmail?: string }) {
  return (
    <ProspectsProvider>
      <Layout onSignOut={onSignOut} userEmail={userEmail}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/carte" element={<MapView />} />
          <Route path="/prospect/:id" element={<ProspectCard />} />
          <Route path="/suivi" element={<CampaignTracker />} />
          <Route path="/limitations" element={<Limitations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProspectsProvider>
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
