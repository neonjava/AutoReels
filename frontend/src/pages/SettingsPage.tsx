import { type FormEvent, useEffect, useState } from 'react'
import api from '../services/api'
import { useTheme } from '../hooks/useTheme'
import { Skeleton } from '../components/ui'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null)
  const [saved, setSaved] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data.settings))
  }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    const res = await api.put('/settings', settings)
    setSettings(res.data.settings)
    if (settings.theme === 'light' || settings.theme === 'dark') {
      setTheme(settings.theme)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return <Skeleton className="h-96 rounded-3xl" />

  function field(key: string, label: string, multiline = false) {
    if (multiline) {
      return (
        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <textarea
            rows={6}
            value={settings![key] ?? ''}
            onChange={(e) => setSettings({ ...settings!, [key]: e.target.value })}
            className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </label>
      )
    }
    return (
      <label className="block space-y-1.5">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        <input
          value={settings![key] ?? ''}
          onChange={(e) => setSettings({ ...settings!, [key]: e.target.value })}
          className="w-full rounded-2xl glass-soft px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400/40"
        />
      </label>
    )
  }

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title text-3xl">Settings</h1>
        <p className="text-[var(--muted)] mt-1">Defaults, theme, and upload behavior</p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-4">
        {field('default_hashtags', 'Default hashtags (one per line)', true)}
        {field('default_platforms', 'Default platforms (comma-separated)')}
        {field('download_location', 'Download location')}
        {field('upload_quality', 'Upload quality')}
        {field('retry_count', 'Retry count')}

        <label className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3">
          <span className="text-sm">Auto-delete downloaded videos</span>
          <input
            type="checkbox"
            checked={settings.auto_delete_videos === 'true'}
            onChange={(e) =>
              setSettings({
                ...settings,
                auto_delete_videos: e.target.checked ? 'true' : 'false',
              })
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3">
          <span className="text-sm">Demo mode (simulate uploads)</span>
          <input
            type="checkbox"
            checked={settings.demo_mode === 'true'}
            onChange={(e) =>
              setSettings({
                ...settings,
                demo_mode: e.target.checked ? 'true' : 'false',
              })
            }
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-[var(--muted)]">Theme</span>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full rounded-2xl glass-soft px-4 py-3 outline-none bg-transparent"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </div>

      <button className="rounded-2xl bg-gradient-to-r from-[#5ac8fa] to-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white">
        {saved ? 'Saved' : 'Save settings'}
      </button>
    </form>
  )
}
