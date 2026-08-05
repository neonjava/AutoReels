import { type FormEvent, useEffect, useState } from 'react'
import api, { type PlatformId, type UploadJob } from '../services/api'
import { ProgressBar, StatusIcon } from '../components/ui'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const ALL: PlatformId[] = ['instagram', 'tiktok', 'youtube']

export default function UploadPage() {
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoPath, setVideoPath] = useState('')
  const [platforms, setPlatforms] = useState<PlatformId[]>([...ALL])
  const [previewing, setPreviewing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState<UploadJob | null>(null)
  const progress = useUploadProgress(job?.id)

  useEffect(() => {
    if (!job) return
    const timer = setInterval(() => {
      api.get(`/history/${job.id}`).then((res) => setJob(res.data.job))
    }, 2000)
    return () => clearInterval(timer)
  }, [job?.id])

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    setPreviewing(true)
    setError('')
    setJob(null)
    try {
      const res = await api.post('/uploads/preview', { url })
      setTitle(res.data.title)
      setDescription(res.data.description || '')
      setCaption(res.data.caption)
      setVideoPath(res.data.videoPath)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Preview failed'
      setError(msg)
    } finally {
      setPreviewing(false)
    }
  }

  async function onUpload() {
    if (!platforms.length) {
      setError('Select at least one platform')
      return
    }
    setUploading(true)
    setError('')
    try {
      const res = await api.post('/uploads', {
        url,
        caption,
        title,
        description,
        videoPath,
        platforms,
      })
      setJob(res.data.job)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Upload failed'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  function toggle(p: PlatformId) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title text-3xl">Upload studio</h1>
        <p className="text-[var(--muted)] mt-1">
          Paste a YouTube Shorts URL, edit the caption, then upload to selected platforms
        </p>
      </div>

      <form onSubmit={onPreview} className="glass rounded-3xl p-5 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">YouTube Shorts URL</span>
          <input
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/..."
            className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </label>
        <button
          disabled={previewing}
          className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"
        >
          {previewing && <Loader2 className="h-4 w-4 animate-spin" />}
          {previewing ? 'Downloading…' : 'Download & preview'}
        </button>
      </form>

      {caption && (
        <div className="glass rounded-3xl p-5 space-y-4">
          <div>
            <div className="text-xs text-[var(--muted)]">Title</div>
            <div className="font-medium mt-1">{title}</div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--muted)]">Caption (editable)</span>
            <textarea
              rows={8}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40 resize-y"
            />
          </label>

          <div>
            <div className="text-xs text-[var(--muted)] mb-2">Platforms</div>
            <div className="flex flex-wrap gap-2">
              {ALL.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(p)}
                  className={clsx(
                    'px-4 py-2 rounded-2xl text-sm capitalize transition',
                    platforms.includes(p)
                      ? 'bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] text-white'
                      : 'glass-soft text-[var(--muted)]'
                  )}
                >
                  {p === 'youtube' ? 'YouTube Shorts' : p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onUpload}
            disabled={uploading}
            className="rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {uploading ? 'Starting…' : 'Upload to selected'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {job && (
        <div className="glass rounded-3xl p-5 space-y-3">
          <h2 className="page-title text-lg">Live progress</h2>
          {job.platforms.map((p) => {
            const live = progress[`${job.id}:${p.platform}`]
            const status = live?.status ?? p.status
            const value = live?.progress ?? p.progress
            return (
              <div key={p.platform} className="glass-soft rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 capitalize">
                    <StatusIcon status={status} />
                    {p.platform}
                  </div>
                  <span className="text-xs text-[var(--muted)]">{status}</span>
                </div>
                <ProgressBar value={value} />
                {live?.error || p.error ? (
                  <p className="text-xs text-red-400">{live?.error || p.error}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
