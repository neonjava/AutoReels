import type { PlatformUpload } from '../services/api'
import type { UploadProgressEvent } from '../services/socket'
import { ProgressBar, StatusIcon } from './ui'

type ProgressPanelProps = {
  jobId: string
  platforms: PlatformUpload[]
  live?: Record<string, UploadProgressEvent>
  title?: string
}

export function ProgressPanel({
  jobId,
  platforms,
  live = {},
  title = 'Live progress',
}: ProgressPanelProps) {
  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <h2 className="page-title text-lg">{title}</h2>
      {platforms.map((p) => {
        const event = live[`${jobId}:${p.platform}`]
        const status = event?.status ?? p.status
        const value = event?.progress ?? p.progress
        const error = event?.error || p.error
        return (
          <div key={p.platform} className="glass-soft rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 capitalize">
                <StatusIcon status={status} />
                {p.platform === 'youtube' ? 'YouTube Shorts' : p.platform}
              </div>
              <span className="text-xs text-[var(--muted)] capitalize">{status}</span>
            </div>
            <ProgressBar value={value} />
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
