'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [roomName,     setRoomName]     = useState('')
  const [displayName,  setDisplayName]  = useState('')
  const [token,        setToken]        = useState(
    process.env.NEXT_PUBLIC_TEST_JWT || ''
  )
  const [loading, setLoading] = useState(false)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim() || !displayName.trim() || !token.trim()) return

    setLoading(true)
    // Pass display name + token via query params (simple approach)
    // In production: token comes from your auth system, not a form field
    router.push(
      `/room/${encodeURIComponent(roomName.trim())}?name=${encodeURIComponent(displayName.trim())}&token=${encodeURIComponent(token.trim())}`
    )
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md animate-fade-in">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-6
            px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs text-accent tracking-widest uppercase">
              Live
            </span>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-white tracking-tight mb-2">
            VideoCall
          </h1>
          <p className="font-mono text-sm text-muted">
            Secure peer-to-peer conferencing
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">

          <Field
            label="Display Name"
            placeholder="e.g. Alex Chen"
            value={displayName}
            onChange={setDisplayName}
            autoFocus
          />

          <Field
            label="Room Name"
            placeholder="e.g. team-standup"
            value={roomName}
            onChange={setRoomName}
          />

          <Field
            label="JWT Token"
            placeholder="Paste your token here"
            value={token}
            onChange={setToken}
            mono
          />

          <button
            type="submit"
            disabled={loading || !roomName || !displayName || !token}
            className="w-full mt-2 py-3.5 rounded-xl font-mono text-sm font-bold tracking-wider
              bg-accent text-void
              hover:bg-accent-dim
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200
              relative overflow-hidden group"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              'Join Room →'
            )}
          </button>

        </form>

        {/* Footer note */}
        <p className="mt-6 text-center font-mono text-xs text-muted/60">
          Room is created automatically if it doesn't exist
        </p>
      </div>
    </main>
  )
}

// ── Field component ───────────────────────────────────────────────────────────

interface FieldProps {
  label:       string
  placeholder: string
  value:       string
  onChange:    (v: string) => void
  autoFocus?:  boolean
  mono?:       boolean
}

const Field = ({ label, placeholder, value, onChange, autoFocus, mono }: FieldProps) => (
  <div className="space-y-1.5">
    <label className="block font-mono text-xs text-muted tracking-wider uppercase">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoFocus={autoFocus}
      className={`w-full px-4 py-3 rounded-xl
        bg-panel border border-border
        text-white placeholder:text-muted/40
        focus:outline-none focus:border-accent/50 focus:bg-panel
        transition-colors duration-200
        ${mono ? 'font-mono text-xs' : 'text-sm'}`}
    />
  </div>
)