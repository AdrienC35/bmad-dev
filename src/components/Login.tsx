import { useState } from 'react'
import { TreePine, LogIn } from 'lucide-react'

interface Props {
  onLogin: (email: string, password: string) => Promise<unknown>
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const err = await onLogin(email, password)
    if (err) setError('Email ou mot de passe incorrect')
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cooperl-100 mb-4">
            <TreePine size={32} className="text-cooperl-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bois & Bocage</h1>
          <p className="text-gray-500 mt-1">Prospection commerciale</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cooperl-500"
              placeholder="demo@bois-bocage.fr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cooperl-500"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-cooperl-600 text-white py-2 rounded-lg font-medium hover:bg-cooperl-700 transition-colors disabled:opacity-50"
          >
            <LogIn size={16} />
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Prototype — Environnement DSI simule
        </p>
      </div>
    </div>
  )
}
