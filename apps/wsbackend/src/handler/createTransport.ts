/**
 * handlers/createTransport.ts
 *
 * Client sends:  { type: 'createWebRtcTransport', payload: { consumer: boolean } }
 * Server replies: { type: 'createWebRtcTransport-response', payload: { params } }
 *
 * 'consumer: false' → send transport (for producing)
 * 'consumer: true'  → recv transport (for consuming)
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from '../index.js'
import * as mediasoup           from '../mediasoupClient.js'

export const handleCreateTransport = async (
  ws: ServerWebSocket<WSData>,
  payload: { consumer: boolean }
) => {
  const { consumer } = payload
  const { socketId }  = ws.data

  const { params } = await mediasoup.createTransport(socketId, consumer)

  ws.send(JSON.stringify({
    type:    'createWebRtcTransport-response',
    payload: { params, consumer },   // ← send consumer flag back so client knows which transport this is
  }))

  console.log(`[createTransport] socketId=${socketId} consumer=${consumer}`)
}