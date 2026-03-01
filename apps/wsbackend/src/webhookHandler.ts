// /**
//  * webhookHandler.ts
//  *
//  * The mediasoup server cannot emit socket events — it has no socket awareness.
//  * When a producer closes (peer left, transport died), mediasoup-server calls
//  * this HTTP endpoint so the Bun WS server can push 'producer-closed' to
//  * all affected consumers.
//  *
//  * Webhook payload from mediasoup-server:
//  *   POST /webhook/producer-closed
//  *   Body: { producerId, roomName, secret }
//  *
//  * Security: shared WEBHOOK_SECRET checked on every call.
//  */

// import { sendTo, getRoomMembers } from './socketR.js'

// const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!

// /**
//  * Call this from the Bun HTTP router.
//  * Returns an HTTP Response object.
//  */
// export const handleProducerClosed = (body: {
//   producerId: string
//   roomName:   string
//   secret:     string
// }): Response => {
//   const { producerId, roomName, secret } = body

//   // ── Security check ────────────────────────────────────────────────────────
//   if (secret !== WEBHOOK_SECRET) {
//     console.warn('[Webhook] Unauthorized call — wrong secret')
//     return new Response(JSON.stringify({ error: 'Unauthorized' }), {
//       status:  401,
//       headers: { 'Content-Type': 'application/json' },
//     })
//   }

//   if (!producerId || !roomName) {
//     return new Response(JSON.stringify({ error: 'producerId and roomName are required' }), {
//       status:  400,
//       headers: { 'Content-Type': 'application/json' },
//     })
//   }

//   // ── Notify all peers in the room ─────────────────────────────────────────
//   // Every consumer of this producer needs to know so they can clean up
//   // their local consumer + remove the video element.
//   const members = getRoomMembers(roomName)

//   members.forEach(socketId => {
//     sendTo(socketId, 'producer-closed', { remoteProducerId: producerId })
//   })

//   console.log(`[Webhook] producer-closed: producerId=${producerId} room=${roomName} notified ${members.length} peers`)

//   return new Response(JSON.stringify({ notified: members.length }), {
//     status:  200,
//     headers: { 'Content-Type': 'application/json' },
//   })
// }

// After pub Sub

/**
 * webhookHandler.ts
 *
 * One change from original:
 *   getRoomMembers is now async (reads Redis) — add await.
 *   Everything else identical.
 */

import { sendTo, getRoomMembers } from './socketR.js'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!

export const handleProducerClosed = async (body: {
  producerId: string
  roomName:   string
  secret:     string
}): Promise<Response> => {
  const { producerId, roomName, secret } = body

  if (secret !== WEBHOOK_SECRET) {
    console.warn('[Webhook] Unauthorized — wrong secret')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!producerId || !roomName) {
    return new Response(JSON.stringify({ error: 'producerId and roomName required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  // NOW ASYNC — reads room members from Redis
  const members = await getRoomMembers(roomName)

  members.forEach(socketId => {
    sendTo(socketId, 'producer-closed', { remoteProducerId: producerId })
  })

  console.log(`[Webhook] producer-closed: ${producerId} room=${roomName} notified ${members.length} peers`)

  return new Response(JSON.stringify({ notified: members.length }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  })
}