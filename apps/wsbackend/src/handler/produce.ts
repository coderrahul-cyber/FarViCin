/**
 * handlers/produce.ts
 *
 * Client sends:  { type: 'transport-produce', payload: { kind, rtpParameters, appData } }
 * Server replies: { type: 'transport-produce-response', payload: { id, producersExist } }
 *
 * After creating the producer, notifies all OTHER peers in the room
 * by emitting 'new-producer' to each of their sockets.
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from '../index.js'
import * as mediasoup           from '../mediasoupClient.js'
import { sendTo }               from '../socketR.js'

export const handleProduce = async (
  ws: ServerWebSocket<WSData>,
  payload: { kind: string; rtpParameters: object; appData?: object }
) => {
  const { kind, rtpParameters } = payload
  const { socketId }             = ws.data

  const { producerId, producersExist, otherSocketIds } =
    await mediasoup.createProducer(socketId, kind, rtpParameters)

  // ── Notify every other peer in the room ───────────────────────────────────
  // mediasoup-server returned otherSocketIds — the WS server is responsible
  // for the actual socket push since mediasoup has no socket awareness.
  otherSocketIds.forEach(otherId => {
    sendTo(otherId, 'new-producer', { producerId })
  })

  // ── Reply to the producer ─────────────────────────────────────────────────
  ws.send(JSON.stringify({
    type:    'transport-produce-response',
    payload: { id: producerId, producersExist }
  }))

  console.log(`[produce] producerId=${producerId} kind=${kind} notified ${otherSocketIds.length} peers`)
}