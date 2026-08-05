import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autoreels_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

export type Role = 'admin' | 'submitter'
export type PlatformId = 'instagram' | 'tiktok' | 'youtube'

export interface User {
  id: number
  username: string
  role: Role
}

export interface PlatformStatus {
  platform: PlatformId
  connected: boolean
  username: string | null
  lastUploadAt: string | null
  lastStatus: string | null
  demo: boolean
}

export interface PlatformUpload {
  id: number
  job_id: string
  platform: PlatformId
  status: string
  progress: number
  error: string | null
  remote_id: string | null
  updated_at: string
}

export interface UploadJob {
  id: string
  source_url: string
  title: string | null
  description: string | null
  caption: string
  status: string
  created_at: string
  created_by_username?: string
  platforms: PlatformUpload[]
}
