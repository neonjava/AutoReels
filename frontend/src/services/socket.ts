import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      autoConnect: true,
    })
  }
  return socket
}

export interface UploadProgressEvent {
  jobId: string
  platform: string
  status: string
  progress: number
  remoteId?: string
  error?: string
}
