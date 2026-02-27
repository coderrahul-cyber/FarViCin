// 'use client'

// import { useEffect, useState } from 'react'
// import { useParams, useSearchParams, useRouter } from 'next/navigation'
// import { useMediasoup }  from '../../../hooks/useMediasoup'
// import { VideoGrid }     from '../../../components/room/VideoGrid'
// import { ControlBar }    from '../../../components/room/ControlBar'

// export default function RoomPage() {
//   const params       = useParams()
//   const searchParams = useSearchParams()
//   const router       = useRouter()

//   const slug        = decodeURIComponent(params.slug as string)
//   const displayName = searchParams.get('name') || 'Anonymous'
//   const token       = searchParams.get('token') || ''

//   const {
//     participants,
//     connectionState,
//     audioMuted,
//     videoOff,
//     error,
//     join,
//     leave,
//     toggleAudio,
//     toggleVideo,
//   } = useMediasoup(slug, token, displayName)

//   // Auto-join on mount
//   useEffect(() => {
//     if (token) join()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const handleLeave = () => {
//     leave()
//     router.push('/')
//   }

//   const participantList = Array.from(participants.values())

//   // ── Loading state ──────────────────────────────────────────────────────────
//   if (connectionState === 'connecting') {
//     return (
//       <div className="min-h-screen bg-void flex items-center justify-center">
//         <div className="text-center animate-fade-in space-y-4">
//           <div className="w-12 h-12 border-2 border-border border-t-accent rounded-full animate-spin mx-auto" />
//           <p className="font-mono text-sm text-muted">Joining <span className="text-accent">{slug}</span>...</p>
//         </div>
//       </div>
//     )
//   }

//   // ── Error state ────────────────────────────────────────────────────────────
//   if (connectionState === 'error') {
//     return (
//       <div className="min-h-screen bg-void flex items-center justify-center p-6">
//         <div className="text-center animate-fade-in space-y-4 max-w-sm">
//           <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/30
//             flex items-center justify-center mx-auto text-2xl">
//             ⚠️
//           </div>
//           <h2 className="font-display text-xl font-bold text-white">Connection Failed</h2>
//           <p className="font-mono text-sm text-muted">{error}</p>
//           <button
//             onClick={() => router.push('/')}
//             className="px-6 py-2.5 rounded-xl border border-border text-muted
//               hover:border-accent/30 hover:text-accent
//               font-mono text-sm transition-all duration-200"
//           >
//             ← Go back
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // ── No token ───────────────────────────────────────────────────────────────
//   if (!token) {
//     return (
//       <div className="min-h-screen bg-void flex items-center justify-center p-6">
//         <div className="text-center space-y-4">
//           <p className="font-mono text-sm text-muted">No token provided.</p>
//           <button
//             onClick={() => router.push('/')}
//             className="px-6 py-2.5 rounded-xl border border-border text-muted
//               hover:border-accent/30 hover:text-accent font-mono text-sm transition-all"
//           >
//             ← Go back
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // ── Main room UI ───────────────────────────────────────────────────────────
//   return (
//     <div className="h-screen bg-void flex flex-col overflow-hidden">

//       {/* Top bar */}
//       <header className="flex items-center justify-between px-5 py-3
//         bg-surface/80 backdrop-blur border-b border-border shrink-0">
//         <div className="flex items-center gap-3">
//           <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
//           <span className="font-display font-bold text-white text-sm">{slug}</span>
//           <span className="font-mono text-xs text-muted px-2 py-0.5 rounded bg-panel border border-border">
//             {participantList.length} online
//           </span>
//         </div>

//         <div className="flex items-center gap-2">
//           {/* Connection indicator */}
//           <span className={`font-mono text-xs px-2 py-0.5 rounded border
//             ${connectionState === 'connected'
//               ? 'text-accent border-accent/30 bg-accent/5'
//               : 'text-muted border-border bg-panel'
//             }`}>
//             {connectionState}
//           </span>
//         </div>
//       </header>

//       {/* Video grid */}
//       <div className="flex-1 overflow-hidden flex flex-col">
//         <VideoGrid participants={participantList} />
//       </div>

//       {/* Control bar */}
//       <ControlBar
//         audioMuted={audioMuted}
//         videoOff={videoOff}
//         onToggleAudio={toggleAudio}
//         onToggleVideo={toggleVideo}
//         onLeave={handleLeave}
//         participantCount={participantList.length}
//       />

//     </div>
//   )
// }


// with gurad 

'use client'

import { useEffect , useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useMediasoup }  from '../../../hooks/useMediasoup'
import { VideoGrid }     from '../../../components/room/VideoGrid'
import { ControlBar }    from '../../../components/room/ControlBar'

export default function RoomPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const slug        = decodeURIComponent(params.slug as string)
  const displayName = searchParams.get('name') || 'Anonymous'
  const token       = searchParams.get('token') || ''

  const {
    participants,
    connectionState,
    audioMuted,
    videoOff,
    error,
    join,
    leave,
    toggleAudio,
    toggleVideo,
  } = useMediasoup(slug, token, displayName)

  // Guard against React StrictMode double-invoke in dev
  const hasJoined = useRef(false)
  useEffect(() => {
    if (token && !hasJoined.current) {
      hasJoined.current = true
      join()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = () => {
    leave()
    router.push('/')
  }

  const participantList = Array.from(participants.values())

  // ── Loading ────────────────────────────────────────────────────────────────
  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center animate-fade-in space-y-4">
          <div className="w-12 h-12 border-2 border-border border-t-accent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-sm text-muted">
            Joining <span className="text-accent">{slug}</span>...
          </p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (connectionState === 'error') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="text-center animate-fade-in space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-danger/10 border border-danger/30
            flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h2 className="font-display text-xl font-bold text-white">Connection Failed</h2>
          <p className="font-mono text-sm text-muted">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl border border-border text-muted
              hover:border-accent/30 hover:text-accent font-mono text-sm transition-all duration-200"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  // ── No token ───────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="font-mono text-sm text-muted">No token provided.</p>
          <button onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl border border-border text-muted
              hover:border-accent/30 hover:text-accent font-mono text-sm transition-all">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  // ── Main room UI ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-void flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3
        bg-surface/80 backdrop-blur border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-white text-sm">{slug}</span>
          <span className="font-mono text-xs text-muted px-2 py-0.5 rounded bg-panel border border-border">
            {participantList.length} online
          </span>
        </div>
        <span className={`font-mono text-xs px-2 py-0.5 rounded border
          ${connectionState === 'connected'
            ? 'text-accent border-accent/30 bg-accent/5'
            : 'text-muted border-border bg-panel'
          }`}>
          {connectionState}
        </span>
      </header>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <VideoGrid participants={participantList} />
      </div>

      {/* Controls */}
      <ControlBar
        audioMuted={audioMuted}
        videoOff={videoOff}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
        participantCount={participantList.length}
      />
    </div>
  )
}