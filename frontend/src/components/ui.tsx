import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { PlatformStatus } from '../services/api'
import clsx from 'clsx'

const labels: Record<string, string> = {
  instagram: 'Instagram 1',
  instagram2: 'Instagram 2',
  tiktok: 'TikTok',
  youtube: 'YouTube Shorts',
}

export function PlatformCard({
  platform,
  onConnect,
  onDisconnect,
}: {
  platform: PlatformStatus
  onConnect?: () => void
  onDisconnect?: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass rounded-3xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="page-title text-lg">{labels[platform.platform]}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            {platform.username ? `@${platform.username}` : 'No account linked'}
          </p>
        </div>
        <span
          className={clsx(
            'text-xs px-2.5 py-1 rounded-full',
            platform.connected
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-white/5 text-[var(--muted)]'
          )}
        >
          {platform.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="glass-soft rounded-2xl p-3">
          <div className="text-[var(--muted)] text-xs">Last upload</div>
          <div className="mt-1 truncate">
            {platform.lastUploadAt
              ? new Date(platform.lastUploadAt + 'Z').toLocaleString()
              : '—'}
          </div>
        </div>
        <div className="glass-soft rounded-2xl p-3">
          <div className="text-[var(--muted)] text-xs">Status</div>
          <div className="mt-1 capitalize">{platform.lastStatus ?? 'idle'}</div>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={onConnect}
          className="flex-1 rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] text-white text-sm py-2.5 font-medium"
        >
          {platform.connected ? 'Reconnect' : 'Connect'}
        </button>
        {platform.connected && (
          <button
            onClick={onDisconnect}
            className="rounded-2xl glass-soft px-4 text-sm text-[var(--muted)]"
          >
            Disconnect
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-400" />
  if (status === 'uploading' || status === 'pending' || status === 'processing') {
    return <Loader2 className="h-4 w-4 text-sky-400 animate-spin" />
  }
  return <Loader2 className="h-4 w-4 text-[var(--muted)]" />
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff]"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ ease: 'easeOut', duration: 0.35 }}
      />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-2xl bg-white/5 border border-white/5',
        className
      )}
    />
  )
}
