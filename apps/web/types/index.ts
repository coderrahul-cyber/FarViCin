// types/index.ts — shared types across the frontend

export interface Participant {
  socketId:     string
  name:         string
  stream?:      MediaStream   // video stream → shown in <video>
  audioStream?: MediaStream   // audio stream → played in <audio> (remote only)
  audioMuted:   boolean
  videoOff:     boolean
  isLocal:      boolean
}

export interface WSMessage {
  type:    string
  payload: Record<string, any>
}

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'