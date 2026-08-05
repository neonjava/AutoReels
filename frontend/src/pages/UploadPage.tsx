import { type FormEvent, useEffect, useState } from 'react'
import api, { type PlatformId, type UploadJob } from '../services/api'
import { CaptionEditor } from '../components/CaptionEditor'
import { ProgressPanel } from '../components/ProgressPanel'
import { useUploadProgress } from '../hooks/useUploadProgress'
import { Clock, Loader2, Zap } from 'lucide-react'
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
  const [delayHours, setDelayHours] = useState(6)
  const [publishNow, setPublishNow] = useState(false)
  const [scheduledInfo, setScheduledInfo] = useState<string | null>(null)
  const progress = useUploadProgress(job?.id)

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const h = Number(res.data.settings?.upload_delay_hours ?? 6)
        setDelayHours(Number.isFinite(h) ? h : 6)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!job || job.status === 'scheduled') return
    const timer = setInterval(() => {
      api.get(`/history/${job.id}`).then((res) => setJob(res.data.job))
    }, 2000)
    return () => clearInterval(timer)
  }, [job?.id, job?.status])

  async function onPreview(e: FormEvent) {
    e.preventDefault()
    setPreviewing(true)
    setError('')
    setJob(null)
    setScheduledInfo(null)
    try {
      const res = await api.post('/uploads/preview', { url })
      setTitle(res.data.title)
      setDescription(res.data.description || '')
      setCaption(res.data.caption)
      setVideoPath(res.data.videoPath)
      if (typeof res.data.delayHours === 'number') setDelayHours(res.data.delayHours)
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
    setScheduledInfo(null)
    try {
      const res = await api.post('/uploads', {
        url,
        caption,
        title,
        description,
        videoPath,
        platforms,
        publishNow,
      })
      setJob(res.data.job)
      if (res.data.scheduledFor) {
        const when = new Date(res.data.scheduledFor + 'Z').toLocaleString()
        setScheduledInfo(
          `Scheduled — will publish in ${res.data.delayHours}h (around ${when})`
        )
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Upload failed'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  async function forcePublish() {
    if (!job) return
    setUploading(true)
    try {
      const res = await api.post(`/uploads/${job.id}/publish-now`)
      setJob(res.data.job)
      setScheduledInfo(null)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not publish now'
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

      {delayHours > 0 && (
        <div className="glass-soft rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
          <Clock className="h-4 w-4 mt-0.5 text-sky-400 shrink-0" />
          <div>
            Posts are delayed by <strong>{delayHours} hours</strong> after you click upload.
            Video downloads now; platforms publish later.
          </div>
        </div>
      )}

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

          <CaptionEditor value={caption} onChange={setCaption} />

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

          {delayHours > 0 && (
            <label className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3">
              <span className="text-sm inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-300" />
                Publish immediately (skip {delayHours}h delay)
              </span>
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
              />
            </label>
          )}

          <button
            onClick={onUpload}
            disabled={uploading}
            className="rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {uploading
              ? 'Starting…'
              : publishNow || delayHours === 0
                ? 'Upload to selected'
                : `Schedule upload (+${delayHours}h)`}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {scheduledInfo && (
        <div className="glass rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sky-300">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{scheduledInfo}</span>
          </div>
          <button
            onClick={forcePublish}
            disabled={uploading}
            className="rounded-2xl glass-soft px-4 py-2 text-sm inline-flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Publish now instead
          </button>
        </div>
      )}

      {job && job.status !== 'scheduled' && (
        <ProgressPanel jobId={job.id} platforms={job.platforms} live={progress} />
      )}
    </div>
  )
}
