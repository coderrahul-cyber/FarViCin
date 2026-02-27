'use client'

interface ControlBarProps {
  audioMuted:   boolean
  videoOff:     boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onLeave:       () => void
  participantCount: number
}

export const ControlBar = ({
  audioMuted,
  videoOff,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  participantCount,
}: ControlBarProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4
      bg-panel/80 backdrop-blur-md border-t border-border">

      {/* Left — room info */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-mono text-sm text-muted">
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Center — controls */}
      <div className="flex items-center gap-3">

        {/* Mic toggle */}
        <ControlButton
          active={!audioMuted}
          onClick={onToggleAudio}
          danger={audioMuted}
          label={audioMuted ? 'Unmute' : 'Mute'}
        >
          {audioMuted ? <MicOffIcon /> : <MicIcon />}
        </ControlButton>

        {/* Camera toggle */}
        <ControlButton
          active={!videoOff}
          onClick={onToggleVideo}
          danger={videoOff}
          label={videoOff ? 'Start video' : 'Stop video'}
        >
          {videoOff ? <VideoOffIcon /> : <VideoIcon />}
        </ControlButton>

        {/* Leave */}
        <button
          onClick={onLeave}
          title="Leave room"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-danger/10 border border-danger/30 text-danger
            hover:bg-danger hover:text-white
            transition-all duration-200 font-mono text-sm"
        >
          <PhoneOffIcon />
          <span>Leave</span>
        </button>
      </div>

      {/* Right — spacer for balance */}
      <div className="w-32" />
    </div>
  )
}

// ── Control Button ─────────────────────────────────────────────────────────────

interface ControlButtonProps {
  active:   boolean
  danger?:  boolean
  label:    string
  onClick:  () => void
  children: React.ReactNode
}

const ControlButton = ({ active, danger, label, onClick, children }: ControlButtonProps) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      w-12 h-12 rounded-xl flex items-center justify-center
      border transition-all duration-200 relative group
      ${danger
        ? 'bg-danger/10 border-danger/40 text-danger hover:bg-danger hover:text-white'
        : active
          ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
          : 'bg-border/50 border-border text-muted hover:text-white hover:border-muted'
      }
    `}
  >
    {children}
    {/* Tooltip */}
    <span className="absolute -top-9 left-1/2 -translate-x-1/2
      px-2 py-1 rounded bg-void border border-border
      font-mono text-xs text-muted whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {label}
    </span>
  </button>
)

// ── Icons ─────────────────────────────────────────────────────────────────────

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const MicOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

const VideoOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/>
    <path d="M23 7l-7 5 7 5V7z"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const PhoneOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/>
    <path d="M14.5 2.5s4 .5 4 3.5v3"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)