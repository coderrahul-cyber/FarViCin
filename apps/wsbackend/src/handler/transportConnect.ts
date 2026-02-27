/**
 * handlers/transportConnect.ts
 *
 * Client sends:  { type: 'transport-connect', payload: { dtlsParameters } }
 * Server replies: { type: 'transport-connect-response', payload: { connected: true } }
 *
 * Completes the DTLS handshake for the SEND (producer) transport.
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from '../index.js'
import * as mediasoup           from '../mediasoupClient.js'

export const handleTransportConnect = async (
  ws: ServerWebSocket<WSData>,
  payload: { dtlsParameters: object }
) => {
  const { dtlsParameters } = payload
  const { socketId }        = ws.data

  await mediasoup.connectTransport(socketId, dtlsParameters)

  ws.send(JSON.stringify({
    type:    'transport-connect-response',
    payload: { connected: true }
  }))

  console.log(`[transportConnect] DTLS connected for socketId=${socketId}`)
}