import { useEffect, useState } from 'react'
import api, { type UploadJob } from '../services/api'
import { Skeleton, StatusIcon } from '../components/ui'
import { CaptionEditor } from '../components/CaptionEditor'

export default function HistoryPage() {
  const [jobs, setJobs] = useState<UploadJob[] | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftCaption, setDraftCaption] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await api.get('/history')
    setJobs(res.data.jobs)
  }

  useEffect(() => {
    void load()
  }, [])

  async function saveCaption(jobId: string) {
    setSaving(true)
    try {
      await api.patch(`/uploads/${jobId}/caption`, { caption: draftCaption })
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

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
                  {job.status === 'scheduled' && job.scheduled_for
                    ? ` · publishes ${new Date(job.scheduled_for + 'Z').toLocaleString()}`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {job.status === 'scheduled' && (
                  <button
                    onClick={async () => {
                      await api.post(`/uploads/${job.id}/publish-now`)
                      await load()
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300"
                  >
                    Publish now
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(editingId === job.id ? null : job.id)
                    setDraftCaption(job.caption)
                  }}
                  className="text-xs px-2.5 py-1 rounded-full glass-soft text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {editingId === job.id ? 'Close' : 'Edit caption'}
                </button>
                <span className="text-xs capitalize px-2.5 py-1 rounded-full bg-white/5">
                  {job.status}
                </span>
              </div>
            </div>

            {editingId === job.id && (
              <div className="space-y-3">
                <CaptionEditor value={draftCaption} onChange={setDraftCaption} rows={5} />
                <button
                  disabled={saving}
                  onClick={() => saveCaption(job.id)}
                  className="rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save caption'}
                </button>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-2">
              {job.platforms.map((p) => (
                <div
                  key={p.platform}
                  className="glass-soft rounded-2xl px-3 py-2.5 flex items-center gap-2 text-sm"
                >
                  <StatusIcon status={p.status} />
                  <span className="capitalize">
                    {p.platform === 'youtube' ? 'YouTube' : p.platform}
                  </span>
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
