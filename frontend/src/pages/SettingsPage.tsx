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

  function toggle(key: string, label: string, hint?: string) {
    return (
      <label className="flex items-center justify-between gap-3 glass-soft rounded-2xl px-4 py-3">
        <span className="text-sm">
          {label}
          {hint ? (
            <span className="block text-xs text-[var(--muted)] mt-0.5">{hint}</span>
          ) : null}
        </span>
        <input
          type="checkbox"
          checked={settings![key] === 'true'}
          onChange={(e) =>
            setSettings({
              ...settings!,
              [key]: e.target.checked ? 'true' : 'false',
            })
          }
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
        {field('upload_quality', 'Upload quality')}
        {field('retry_count', 'Retry count')}
        {field(
          'upload_delay_hours',
          'Upload delay (hours)'
        )}

        {toggle('auto_delete_videos', 'Delete uploaded videos after publishing')}

        <div className="pt-2 border-t border-white/10">
          <div className="text-sm font-medium mb-3">Instagram Reel options</div>
          {toggle(
            'ig_hide_like_counts',
            'Hide like & view counts',
            'Sent as like_and_view_counts_disabled when Instagram accepts it'
          )}
          {toggle(
            'ig_disable_remix',
            'Prefer remix/repost off',
            'Account “Allow remixing” in Instagram settings also controls this'
          )}
          {toggle('ig_share_to_feed', 'Also share Reel to Feed tab')}
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="text-sm font-medium mb-3">YouTube options</div>
          {toggle(
            'yt_hide_public_stats',
            'Hide public like / stats on watch page',
            'Sets publicStatsViewable=false (YouTube API). Like-count toggle in Studio may still apply separately.'
          )}
        </div>

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
