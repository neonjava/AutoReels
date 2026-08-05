import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Upload,
  History,
  Share2,
  Settings,
  Users,
  LogOut,
  Clapperboard,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/platforms', label: 'Platforms', icon: Share2 },
  { to: '/history', label: 'History', icon: History },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-[240px] m-4 mr-0 flex-col glass rounded-3xl p-4 sticky top-4 h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#5ac8fa] to-[#0a84ff] grid place-items-center shadow-lg shadow-blue-500/20">
            <Clapperboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="page-title text-lg leading-none">AutoReels</div>
            <div className="text-xs text-[var(--muted)] mt-1">Admin</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all',
                  isActive
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
          <span className="ml-auto text-xs opacity-60">{user?.username}</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 glass m-3 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="page-title">AutoReels</div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="text-sm text-[var(--muted)]"
          >
            Sign out
          </button>
        </header>
        <nav className="md:hidden flex gap-2 overflow-x-auto px-3 pb-2">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap px-3 py-1.5 rounded-full text-xs glass-soft',
                  isActive && 'bg-white/15'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex-1 p-4 md:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
