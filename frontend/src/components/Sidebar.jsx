import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, KanbanSquare, Megaphone, Shield, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 bg-ms-darker border-r border-ms-border flex flex-col h-screen">
      <div className="p-6 border-b border-ms-border">
        <h1 className="text-xl font-display font-bold tracking-wide">
          <span className="text-ms-gold">MAISON</span>{' '}
          <span className="text-white">SAMAA</span>
        </h1>
        <p className="text-ms-muted text-xs mt-1 tracking-widest uppercase">Real Estate CRM</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'admin')
          .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20'
                  : 'text-gray-400 hover:text-white hover:bg-ms-card border border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-ms-border">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-ms-gold/20 flex items-center justify-center text-ms-gold text-sm font-semibold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-ms-muted capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
