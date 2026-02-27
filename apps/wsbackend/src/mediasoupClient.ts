/**
 * mediasoupClient.ts
 *
 * Single place for ALL HTTP calls from the Bun WS server → mediasoup REST server.
 * If the mediasoup server URL ever changes, only this file needs updating.
 */

const BASE_URL = process.env.MEDIASOUP_SERVER_URL!

/**
 * Internal helper — wraps fetch with JSON body + error handling.
 * We use `rejectUnauthorized: false` since mediasoup uses a self-signed cert.
 */
const call = async <T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: object
): Promise<T> => {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    body ? JSON.stringify(body) : undefined,
    // Bun: disable TLS verification for self-signed certs in development
    // @ts-ignore — Bun-specific tls option
    tls: { rejectUnauthorized: false },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(`[mediasoupClient] ${method} ${path} → ${res.status}: ${err.error}`)
  }

  return res.json() as Promise<T>
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export const createRoom = (roomName: string, socketId: string) =>
  call<{ rtpCapabilities: object }>('POST', '/room/create', { roomName, socketId })

// ─── Transports ───────────────────────────────────────────────────────────────

export const createTransport = (socketId: string, consumer: boolean) =>
  call<{ params: object }>('POST', '/transport/create', { socketId, consumer })

export const connectTransport = (socketId: string, dtlsParameters: object) =>
  call<{ connected: boolean }>('POST', '/transport/connect', { socketId, dtlsParameters })

export const connectConsumerTransport = (
  dtlsParameters: object,
  serverConsumerTransportId: string
) =>
  call<{ connected: boolean }>('POST', '/consumer/connect', {
    dtlsParameters,
    serverConsumerTransportId,
  })

// ─── Producers ────────────────────────────────────────────────────────────────

export const createProducer = (
  socketId: string,
  kind: string,
  rtpParameters: object
) =>
  call<{
    producerId:     string
    producersExist: boolean
    otherSocketIds: string[]   // ← mediasoup returns these so WS can notify peers
  }>('POST', '/producer/create', { socketId, kind, rtpParameters })

export const getProducers = (roomName: string, socketId: string) =>
  call<{ producers: string[] }>('GET', `/producers/${roomName}/${socketId}`)

// ─── Consumers ────────────────────────────────────────────────────────────────

export const createConsumer = (
  socketId: string,
  rtpCapabilities: object,
  remoteProducerId: string,
  serverConsumerTransportId: string
) =>
  call<{ params: object }>('POST', '/consumer/create', {
    socketId,
    rtpCapabilities,
    remoteProducerId,
    serverConsumerTransportId,
  })

export const resumeConsumer = (serverConsumerId: string) =>
  call<{ resumed: boolean }>('POST', '/consumer/resume', { serverConsumerId })

// ─── Peer Cleanup ─────────────────────────────────────────────────────────────

export const removePeer = (socketId: string) =>
  call<{ removed: boolean }>('DELETE', `/peer/${socketId}`)