'use client'

import { VideoTile }   from './VideoTile'
import type { Participant } from '../../types/index'

interface VideoGridProps {
  participants: Participant[]
}

export const VideoGrid = ({ participants }: VideoGridProps) => {
  const count = participants.length

  const gridClass = () => {
    if (count === 1) return 'grid-cols-1 max-w-3xl mx-auto'
    if (count === 2) return 'grid-cols-2'
    if (count <= 4)  return 'grid-cols-2'
    if (count <= 6)  return 'grid-cols-3'
    return 'grid-cols-4'
  }

  if (count === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-border
            flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📡</span>
          </div>
          <p className="font-mono text-muted text-sm">Waiting for participants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 grid gap-3 p-4 content-start ${gridClass()}`}>
      {participants.map((p, i) => (
        <div
          key={p.socketId}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <VideoTile participant={p} />
        </div>
      ))}
    </div>
  )
}