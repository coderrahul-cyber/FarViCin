/**
 * worker.js
 * 
 * Creates and manages the mediasoup Worker.
 * Also holds mediaCodecs config and the createWebRtcTransport helper.
 * 
 * Separated from server.js so the REST layer stays clean.
 */

import mediasoup from 'mediasoup'

let worker

// ─── Codecs ──────────────────────────────────────────────────────────────────

export const mediaCodecs = [
  {
    kind:      'audio',
    mimeType:  'audio/opus',
    clockRate: 48000,
    channels:  2,
  },
  {
    kind:      'video',
    mimeType:  'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
]

// ─── Worker ──────────────────────────────────────────────────────────────────

export const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 2000,
    rtcMaxPort: 2020,
  })

  console.log(`[Worker] Created. PID: ${worker.pid}`)

  worker.on('died', (error) => {
    console.error('[Worker] mediasoup worker died — restarting process.', error)
    setTimeout(() => process.exit(1), 2000)
  })

  return worker
}

export const getWorker = () => worker

// ─── WebRTC Transport Factory ─────────────────────────────────────────────────

/**
 * Creates a WebRtcTransport on the given router.
 * 
 * @param {import('mediasoup').types.Router} router
 * @returns {Promise<import('mediasoup').types.WebRtcTransport>}
 */
export const createWebRtcTransport = async (router) => {
  const options = {
    listenIps: [
      {
        ip:          '0.0.0.0',
        announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1', // ← set via .env
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  }

  const transport = await router.createWebRtcTransport(options)

  console.log(`[Worker] Transport created. ID: ${transport.id}`)

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') {
      console.log(`[Worker] Transport ${transport.id} DTLS closed — closing transport.`)
      transport.close()
    }
  })

  transport.on('close', () => {
    console.log(`[Worker] Transport ${transport.id} closed.`)
  })

  return transport
}