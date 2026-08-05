import { useEffect, useState } from 'react'
import { getSocket, type UploadProgressEvent } from '../services/socket'

export function useUploadProgress(jobId?: string) {
  const [events, setEvents] = useState<Record<string, UploadProgressEvent>>({})

  useEffect(() => {
    const socket = getSocket()
    const onProgress = (payload: UploadProgressEvent) => {
      if (jobId && payload.jobId !== jobId) return
      setEvents((prev) => ({
        ...prev,
        [`${payload.jobId}:${payload.platform}`]: payload,
      }))
    }
    socket.on('upload:progress', onProgress)
    return () => {
      socket.off('upload:progress', onProgress)
    }
  }, [jobId])

  return events
}
