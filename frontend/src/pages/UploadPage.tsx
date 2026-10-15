import { type FormEvent, useEffect, useState } from 'react'
import api, { type PlatformId, type PlatformStatus, type UploadJob } from '../services/api'
import { ProgressPanel } from '../components/ProgressPanel'
import { useUploadProgress } from '../hooks/useUploadProgress'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [connected, setConnected] = useState<PlatformStatus[]>([])
  const [selected, setSelected] = useState<PlatformId[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState<UploadJob | null>(null)
  const progress = useUploadProgress(job?.id)

  useEffect(() => {
    api.get('/platforms').then((res) => {
      const platforms = (res.data.platforms as PlatformStatus[]).filter((p) => p.connected)
      setConnected(platforms)
      setSelected(platforms.map((p) => p.platform))
    }).catch(() => setError('Could not load connected platforms'))
  }, [])

  useEffect(() => {
    if (!job || ['completed', 'partial', 'failed'].includes(job.status)) return
    const timer = setInterval(() => {
      api.get(`/history/${job.id}`).then((res) => setJob(res.data.job)).catch(() => undefined)
    }, 2000)
    return () => clearInterval(timer)
  }, [job?.id, job?.status])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!file || !selected.length) return setError('Choose an MP4 video and a connected platform')
    setBusy(true)
    setError('')
    const data = new FormData()
    data.append('video', file)
    data.append('title', title)
    data.append('caption', caption)
    data.append('platforms', JSON.stringify(selected))
    data.append('publishNow', 'true')
    try {
      const response = await api.post('/uploads', data)
      setJob(response.data.job)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6 max-w-3xl">
    <div><h1 className="page-title text-3xl">Publish a video</h1><p className="text-[var(--muted)] mt-1">Upload one MP4 and publish it to your connected accounts.</p></div>
    <form onSubmit={submit} className="glass rounded-3xl p-5 space-y-4">
      <label className="block space-y-1"><span>MP4 video</span><input type="file" accept="video/mp4,.mp4" required onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <label className="block space-y-1"><span>Title</span><input className="w-full rounded-xl glass-soft p-3" required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block space-y-1"><span>Caption</span><textarea className="w-full rounded-xl glass-soft p-3" required value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
      <div><p className="mb-2">Connected platforms</p>{connected.length === 0 && <p className="text-sm text-[var(--muted)]">Connect an account on the Platforms page first.</p>}{connected.map((p) => <label key={p.platform} className="inline-flex items-center gap-2 mr-4"><input type="checkbox" checked={selected.includes(p.platform)} onChange={() => setSelected((prev) => prev.includes(p.platform) ? prev.filter((x) => x !== p.platform) : [...prev, p.platform])} />{p.platform}</label>)}</div>
      <button disabled={busy || !connected.length} className="rounded-xl bg-sky-600 px-5 py-3 text-white disabled:opacity-50">{busy ? 'Uploading…' : 'Publish to selected platforms'}</button>
      {error && <p className="text-red-400">{error}</p>}
    </form>
    {job && <ProgressPanel jobId={job.id} platforms={job.platforms} live={progress} />}
  </div>
}
