import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clapperboard, Link2, ListVideo, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'

const links = [
  { to: '/submit', label: 'Submit', icon: Link2 },
  { to: '/my-uploads', label: 'My Uploads', icon: ListVideo },
]

export default function SubmitterLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="sticky top-3 z-20 mx-3 md:mx-auto md:max-w-3xl glass rounded-3xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#5ac8fa] to-[#0a84ff] grid place-items-center">
            <Clapperboard className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="page-title text-base">AutoReels</div>
            <div className="text-[11px] text-[var(--muted)]">Submitter · {user?.username}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
                  isActive ? 'bg-white/10' : 'text-[var(--muted)] hover:bg-white/5'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="p-2 rounded-full hover:bg-white/5 text-[var(--muted)]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="sm:hidden flex gap-2 px-3 mt-3">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex-1 text-center py-2 rounded-2xl text-sm glass-soft',
                isActive && 'bg-white/10'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl p-4 md:p-6"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
