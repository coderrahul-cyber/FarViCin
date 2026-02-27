/**
 * handlers/consumerResume.ts
 *
 * Client sends:  { type: 'consumer-resume', payload: { serverConsumerId } }
 * Server replies: { type: 'consumer-resume-response', payload: { resumed: true } }
 *
 * Called after the client has set up the remote MediaStreamTrack and is ready to play.
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from '../index.js'
import * as mediasoup           from '../mediasoupClient.js'

export const handleConsumerResume = async (
  ws: ServerWebSocket<WSData>,
  payload: { serverConsumerId: string }
) => {
  const { serverConsumerId } = payload

  await mediasoup.resumeConsumer(serverConsumerId)

  ws.send(JSON.stringify({
    type:    'consumer-resume-response',
    payload: { resumed: true }
  }))

  console.log(`[consumerResume] consumer=${serverConsumerId} resumed`)
}