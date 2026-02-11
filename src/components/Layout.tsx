import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, BarChart3, TreePine, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

const tabs = [
  { to: '/', label: 'Pipeline', icon: LayoutDashboard },
  { to: '/carte', label: 'Carte', icon: Map },
  { to: '/suivi', label: 'Suivi', icon: BarChart3 },
]

interface Props {
  children: ReactNode
  onSignOut: () => void
  userEmail?: string
}

export default function Layout({ children, onSignOut, userEmail }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cooperl-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <TreePine size={24} />
        <h1 className="text-lg font-semibold tracking-tight">Bois & Bocage</h1>
        <span className="text-cooperl-200 text-sm ml-1">Prospection</span>
        <div className="ml-auto flex items-center gap-3">
          {userEmail && <span className="text-cooperl-200 text-sm hidden sm:block">{userEmail}</span>}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 text-cooperl-200 hover:text-white text-sm transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Deconnexion</span>
          </button>
        </div>
      </header>

      <nav className="bg-white border-b px-4 flex gap-1">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-cooperl-600 text-cooperl-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  )
}
