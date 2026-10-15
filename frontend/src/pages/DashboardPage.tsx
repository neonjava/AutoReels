import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import api from '../services/api'
import { Skeleton } from '../components/ui'

interface Analytics {
  uploadsOverTime: Array<{ day: string; count: number }>
  byPlatform: Array<{ platform: string; status: string; count: number }>
  successRate: { success: number; failed: number; total: number }
  recent: Array<{
    id: string
    title: string | null
    status: string
    created_at: string
    created_by_username: string
  }>
  totals: { jobs: number; submitters: number; connected: number }
}

const COLORS = ['#5ac8fa', '#0a84ff', '#30d158', '#ffd60a', '#ff453a']

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    api.get('/analytics').then((res) => setData(res.data))
  }, [])

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const platformMix = ['instagram', 'instagram2', 'tiktok', 'youtube'].map((p) => ({
    name: p === 'instagram' ? 'IG 1' : p === 'instagram2' ? 'IG 2' : p === 'youtube' ? 'YouTube' : 'TikTok',
    value: data.byPlatform
      .filter((r) => r.platform === p)
      .reduce((sum, r) => sum + r.count, 0),
  }))

  const successVsFailed = ['instagram', 'instagram2', 'tiktok', 'youtube'].map((p) => ({
    platform: p === 'instagram' ? 'Instagram 1' : p === 'instagram2' ? 'Instagram 2' : p === 'youtube' ? 'YouTube' : 'TikTok',
    success: data.byPlatform
      .filter((r) => r.platform === p && r.status === 'success')
      .reduce((sum, r) => sum + r.count, 0),
    failed: data.byPlatform
      .filter((r) => r.platform === p && r.status === 'failed')
      .reduce((sum, r) => sum + r.count, 0),
  }))

  const successPct =
    data.successRate.total > 0
      ? Math.round((data.successRate.success / data.successRate.total) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-3xl">Dashboard</h1>
        <p className="text-[var(--muted)] mt-1">Upload performance across platforms</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total jobs', value: data.totals.jobs },
          { label: 'Submitters', value: data.totals.submitters },
          { label: 'Connected platforms', value: data.totals.connected },
        ].map((card) => (
          <div key={card.label} className="glass rounded-3xl p-5">
            <div className="text-sm text-[var(--muted)]">{card.label}</div>
            <div className="page-title text-3xl mt-2">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="page-title text-lg">Uploads (30 days)</h2>
            <span className="text-sm text-[var(--muted)]">{successPct}% success</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.uploadsOverTime}>
                <defs>
                  <linearGradient id="uploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5ac8fa" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#5ac8fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,22,30,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#5ac8fa" fill="url(#uploads)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <h2 className="page-title text-lg mb-4">Platform mix</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {platformMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(20,22,30,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-[var(--muted)]">
            {platformMix.map((p, i) => (
              <span key={p.name} className="inline-flex items-center gap-1.5 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <h2 className="page-title text-lg mb-4">Success vs failed by platform</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={successVsFailed}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="platform" tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8e8e93', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(20,22,30,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                }}
              />
              <Legend />
              <Bar dataKey="success" fill="#30d158" radius={[8, 8, 0, 0]} />
              <Bar dataKey="failed" fill="#ff453a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <h2 className="page-title text-lg mb-4">Recent activity</h2>
        <div className="space-y-2">
          {data.recent.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No uploads yet</p>
          )}
          {data.recent.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{item.title || 'Untitled'}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">
                  {item.created_by_username} · {new Date(item.created_at + 'Z').toLocaleString()}
                </div>
              </div>
              <span className="text-xs capitalize px-2.5 py-1 rounded-full bg-white/5">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
