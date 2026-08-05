import { useEffect, useState } from 'react'
import api, { type UploadJob } from '../services/api'
import { Skeleton, StatusIcon, ProgressBar } from '../components/ui'
import { useUploadProgress } from '../hooks/useUploadProgress'

export default function MyUploadsPage() {
  const [jobs, setJobs] = useState<UploadJob[] | null>(null)
  const progress = useUploadProgress()

  useEffect(() => {
    const load = () => api.get('/history').then((res) => setJobs(res.data.jobs))
    void load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [])

  if (!jobs) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-3xl">My uploads</h1>
        <p className="text-[var(--muted)] mt-1">Status for links you submitted</p>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 && (
          <div className="glass rounded-3xl p-6 text-[var(--muted)]">
            You have not submitted any links yet
          </div>
        )}
        {jobs.map((job) => (
          <div key={job.id} className="glass rounded-3xl p-5 space-y-3">
            <div className="flex justify-between gap-2">
              <div>
                <div className="page-title text-lg">{job.title || 'Untitled'}</div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {new Date(job.created_at + 'Z').toLocaleString()}
                </div>
              </div>
              <span className="text-xs capitalize px-2.5 py-1 rounded-full bg-white/5 h-fit">
                {job.status}
              </span>
            </div>
            {job.platforms.map((p) => {
              const live = progress[`${job.id}:${p.platform}`]
              const status = live?.status ?? p.status
              const value = live?.progress ?? p.progress
              return (
                <div key={p.platform} className="glass-soft rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm capitalize">
                    <StatusIcon status={status} />
                    {p.platform}
                    <span className="ml-auto text-xs text-[var(--muted)]">{status}</span>
                  </div>
                  <ProgressBar value={value} />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
