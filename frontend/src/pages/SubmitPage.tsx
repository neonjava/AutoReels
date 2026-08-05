import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { type UploadJob } from '../services/api'
import { Loader2 } from 'lucide-react'
import { ProgressPanel } from '../components/ProgressPanel'
import { useUploadProgress } from '../hooks/useUploadProgress'

export default function SubmitPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [job, setJob] = useState<UploadJob | null>(null)
  const progress = useUploadProgress(job?.id)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/uploads', { url })
      setJob(res.data.job)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Submit failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-3xl">Submit a Short</h1>
        <p className="text-[var(--muted)] mt-1">
          Paste a YouTube Shorts link. Caption hashtags and platforms are applied automatically.
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass rounded-[28px] p-6 space-y-4">
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/shorts/..."
          className="w-full rounded-2xl glass-soft px-4 py-3.5 outline-none focus:ring-2 focus:ring-sky-400/40"
        />
        <button
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] py-3 font-medium text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Submitting…' : 'Submit for upload'}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {job && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="page-title text-lg">{job.title || 'Upload started'}</div>
            <button onClick={() => navigate('/my-uploads')} className="text-sm text-sky-400">
              View all
            </button>
          </div>
          <ProgressPanel
            jobId={job.id}
            platforms={job.platforms}
            live={progress}
            title="Upload status"
          />
        </div>
      )}
    </div>
  )
}
