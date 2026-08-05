import { useEffect, useState } from 'react'
import api, { type PlatformStatus, type PlatformId } from '../services/api'
import { PlatformCard, Skeleton } from '../components/ui'

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<PlatformStatus[] | null>(null)

  async function load() {
    const res = await api.get('/platforms')
    setPlatforms(res.data.platforms)
  }

  useEffect(() => {
    void load()
  }, [])

  async function connect(platform: PlatformId) {
    const username = window.prompt(`Username / handle for ${platform}`)
    if (!username) return
    const accessToken = window.prompt(
      `Access token for ${platform} (stored encrypted; leave blank for demo connect)`
    )
    await api.post(`/platforms/${platform}/connect`, {
      username,
      credentials: {
        accessToken: accessToken || 'demo-token',
        igUserId: platform === 'instagram' ? 'demo-ig-user' : undefined,
      },
    })
    await load()
  }

  async function disconnect(platform: PlatformId) {
    await api.post(`/platforms/${platform}/disconnect`)
    await load()
  }

  if (!platforms) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-3xl">Platforms</h1>
        <p className="text-[var(--muted)] mt-1">
          Connect Instagram, TikTok, and YouTube Shorts accounts
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {platforms.map((p) => (
          <PlatformCard
            key={p.platform}
            platform={p}
            onConnect={() => connect(p.platform)}
            onDisconnect={() => disconnect(p.platform)}
          />
        ))}
      </div>
    </div>
  )
}
