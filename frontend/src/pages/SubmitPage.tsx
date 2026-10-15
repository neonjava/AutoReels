import { type FormEvent, useState } from 'react'
import api, { type UploadJob } from '../services/api'
import { ProgressPanel } from '../components/ProgressPanel'
import { useUploadProgress } from '../hooks/useUploadProgress'

export default function SubmitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState<UploadJob | null>(null)
  const progress = useUploadProgress(job?.id)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!file) return
    const data = new FormData()
    data.append('video', file)
    data.append('title', title)
    data.append('caption', caption)
    setBusy(true)
    setError('')
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
    <h1 className="page-title text-3xl">Submit a video</h1>
    <p className="text-[var(--muted)]">Upload an MP4 for the connected platforms.</p>
    <form onSubmit={submit} className="glass rounded-3xl p-5 space-y-4">
      <input type="file" accept="video/mp4,.mp4" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input className="w-full rounded-xl glass-soft p-3" placeholder="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full rounded-xl glass-soft p-3" placeholder="Caption" required value={caption} onChange={(e) => setCaption(e.target.value)} />
      <button disabled={busy} className="rounded-xl bg-sky-600 px-5 py-3 text-white disabled:opacity-50">{busy ? 'Uploading…' : 'Submit video'}</button>
      {error && <p className="text-red-400">{error}</p>}
    </form>
    {job && <ProgressPanel jobId={job.id} platforms={job.platforms} live={progress} />}
  </div>
}
