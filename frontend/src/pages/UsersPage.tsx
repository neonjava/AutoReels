import { type FormEvent, useEffect, useState } from 'react'
import api, { type User } from '../services/api'
import { Skeleton } from '../components/ui'
import { Trash2 } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await api.get('/auth/users')
    setUsers(res.data.users)
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/users', {
        username,
        password,
        role: 'submitter',
      })
      setUsername('')
      setPassword('')
      await load()
    } catch {
      setError('Could not create user (username may already exist)')
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this user?')) return
    await api.delete(`/auth/users/${id}`)
    await load()
  }

  if (!users) return <Skeleton className="h-64 rounded-3xl" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title text-3xl">Users</h1>
        <p className="text-[var(--muted)] mt-1">
          Create submitter accounts that can only paste links and track their uploads
        </p>
      </div>

      <form onSubmit={onCreate} className="glass rounded-3xl p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            minLength={3}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-2xl glass-soft px-4 py-3 outline-none"
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-2xl glass-soft px-4 py-3 outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white">
          Create submitter
        </button>
      </form>

      <div className="glass rounded-3xl p-5 space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3"
          >
            <div>
              <div className="font-medium">{u.username}</div>
              <div className="text-xs text-[var(--muted)] capitalize">{u.role}</div>
            </div>
            {u.role !== 'admin' && (
              <button
                onClick={() => onDelete(u.id)}
                className="p-2 rounded-xl hover:bg-white/5 text-[var(--muted)]"
                aria-label="Delete user"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
