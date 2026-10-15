import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clapperboard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(username, password)
      navigate(user.role === 'admin' ? '/' : '/submit')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass w-full max-w-md rounded-[28px] p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#5ac8fa] to-[#0a84ff] grid place-items-center">
            <Clapperboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="page-title text-2xl">AutoReels</h1>
            <p className="text-sm text-[var(--muted)]">Sign in to continue</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">Username</span>
          <input
            className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">Password</span>
          <input
            type="password"
            className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </motion.form>
    </div>
  )
}
