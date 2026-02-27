/**
 * lib/wsClient.ts
 *
 * Native WebSocket wrapper with promise-based request/response.
 * Sends:    { type, payload }
 * Receives: { type, payload }
 */

import type { WSMessage } from '../types'

type Handler = (payload: any) => void

export class WSClient {
  private ws:       WebSocket | null = null
  private handlers: Map<string, Handler[]> = new Map()
  // key = expected response type e.g. 'joinRoom-response'
  private pending:  Map<string, { resolve: Function; reject: Function }> = new Map()
  private url:      string
  private token:    string

  constructor(url: string, token: string) {
    this.url   = url
    this.token = token
  }

  // ── Connect ────────────────────────────────────────────────────────────────

  connect(): Promise<{ socketId: string }> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.url}?token=${this.token}`)

      this.ws.onopen = () => {
        console.log('[WSClient] Socket opened — waiting for connection-success')
      }

      this.ws.onmessage = (event) => {
        let msg: WSMessage
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          console.error('[WSClient] Failed to parse message:', event.data)
          return
        }

        const { type, payload } = msg
        console.log('[WSClient] ← received:', type, payload)

        // 1. connection-success resolves connect()
        if (type === 'connection-success') {
          resolve(payload)
          return
        }

        // 2. Check if this matches a pending request response
        if (this.pending.has(type)) {
          const p = this.pending.get(type)!
          this.pending.delete(type)
          p.resolve(payload)
          return
        }

        // 3. Fire registered event listeners (server-pushed events)
        const listeners = this.handlers.get(type) ?? []
        if (listeners.length > 0) {
          listeners.forEach(fn => fn(payload))
        } else {
          console.warn('[WSClient] No handler for message type:', type)
        }
      }

      this.ws.onerror = (err) => {
        console.error('[WSClient] Connection error — is the WS server running on ws:// not wss://?', err)
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onclose = (event) => {
        console.log(`[WSClient] Closed. code=${event.code} reason=${event.reason}`)
        const listeners = this.handlers.get('disconnect') ?? []
        listeners.forEach(fn => fn({}))

        // Reject any still-pending requests
        this.pending.forEach(({ reject }) => {
          reject(new Error('WebSocket closed unexpectedly'))
        })
        this.pending.clear()
      }
    })
  }

  // ── Send a message and wait for its -response ──────────────────────────────

  request<T = any>(type: string, payload: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error(`[WSClient] Cannot send '${type}' — socket not open`))
      }

      // Server responds with 'joinRoom-response' for a 'joinRoom' request
      const responseType = `${type}-response`

      console.log('[WSClient] → sending:', type, payload)

      // Register BEFORE sending to avoid race condition
      const timer = setTimeout(() => {
        if (this.pending.has(responseType)) {
          this.pending.delete(responseType)
          reject(new Error(`[WSClient] Timeout waiting for ${responseType}`))
        }
      }, 15_000)

      this.pending.set(responseType, {
        resolve: (val: any) => { clearTimeout(timer); resolve(val) },
        reject:  (err: any) => { clearTimeout(timer); reject(err) },
      })

      this.ws.send(JSON.stringify({ type, payload }))
    })
  }

  // ── Fire-and-forget send ───────────────────────────────────────────────────

  send(type: string, payload: Record<string, any> = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WSClient] Cannot send — socket not open')
      return
    }
    console.log('[WSClient] → sending (no response):', type)
    this.ws.send(JSON.stringify({ type, payload }))
  }

  // ── Subscribe to server-pushed events ─────────────────────────────────────

  on(type: string, handler: Handler) {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, [...existing, handler])
  }

  off(type: string, handler: Handler) {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, existing.filter(h => h !== handler))
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}