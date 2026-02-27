// types/index.ts — shared types across the frontend

export interface Participant {
  socketId:    string
  name:        string
  stream?:     MediaStream
  audioMuted:  boolean
  videoOff:    boolean
  isLocal:     boolean
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