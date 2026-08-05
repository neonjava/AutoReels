import { useEffect, useState } from 'react'
import api, { type UploadJob } from '../services/api'
import { Skeleton, StatusIcon } from '../components/ui'

export default function HistoryPage() {
  const [jobs, setJobs] = useState<UploadJob[] | null>(null)

  useEffect(() => {
    api.get('/history').then((res) => setJobs(res.data.jobs))
  }, [])

  if (!jobs) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-3xl">Upload history</h1>
        <p className="text-[var(--muted)] mt-1">Per-platform status for every job</p>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 && (
          <div className="glass rounded-3xl p-6 text-[var(--muted)]">No uploads yet</div>
        )}
        {jobs.map((job) => (
          <div key={job.id} className="glass rounded-3xl p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="page-title text-lg">{job.title || 'Untitled'}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {job.created_by_username} · {new Date(job.created_at + 'Z').toLocaleString()}
                </div>
              </div>
              <span className="text-xs capitalize px-2.5 py-1 rounded-full bg-white/5">
                {job.status}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {job.platforms.map((p) => (
                <div
                  key={p.platform}
                  className="glass-soft rounded-2xl px-3 py-2.5 flex items-center gap-2 text-sm"
                >
                  <StatusIcon status={p.status} />
                  <span className="capitalize">{p.platform}</span>
                  <span className="ml-auto text-xs text-[var(--muted)] capitalize">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
