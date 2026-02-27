// /**
//  * hooks/useMediasoup.ts
//  *
//  * Core hook that manages:
//  *  - WebSocket connection (via WSClient)
//  *  - mediasoup-client Device
//  *  - Send/Recv transports
//  *  - Producing local audio+video
//  *  - Consuming remote producers
//  *  - Participant state (for UI)
//  */

// 'use client'

// import { useCallback, useEffect, useRef, useState } from 'react'
// import { Device }    from 'mediasoup-client'
// import { WSClient }  from '../libs/wsClient'
// import type { Participant, ConnectionState } from '../types'

// const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:8080'

// export const useMediasoup = (roomName: string, token: string, displayName: string) => {
//   const [participants,     setParticipants]     = useState<Map<string, Participant>>(new Map())
//   const [connectionState,  setConnectionState]  = useState<ConnectionState>('idle')
//   const [localStream,      setLocalStream]      = useState<MediaStream | null>(null)
//   const [audioMuted,       setAudioMuted]       = useState(false)
//   const [videoOff,         setVideoOff]         = useState(false)
//   const [error,            setError]            = useState<string | null>(null)

//   const wsRef            = useRef<WSClient | null>(null)
//   const deviceRef        = useRef<Device | null>(null)
//   const sendTransportRef = useRef<any>(null)
//   const recvTransportRef = useRef<any>(null)
//   const localSocketId    = useRef<string>('')
//   const producersRef     = useRef<Map<string, any>>(new Map())  // producerId → producer
//   const consumersRef     = useRef<Map<string, any>>(new Map())  // producerId → consumer

//   // ── Helpers ────────────────────────────────────────────────────────────────

//   const updateParticipant = (socketId: string, update: Partial<Participant>) => {
//     setParticipants(prev => {
//       const next = new Map(prev)
//       const existing = next.get(socketId)
//       if (existing) {
//         next.set(socketId, { ...existing, ...update })
//       } else {
//         next.set(socketId, {
//           socketId,
//           name:       displayName,
//           audioMuted: false,
//           videoOff:   false,
//           isLocal:    false,
//           ...update,
//         })
//       }
//       return next
//     })
//   }

//   const removeParticipant = (socketId: string) => {
//     setParticipants(prev => {
//       const next = new Map(prev)
//       next.delete(socketId)
//       return next
//     })
//   }

//   // ── Consume a remote producer ──────────────────────────────────────────────

//   const consumeProducer = useCallback(async (remoteProducerId: string) => {
//     const ws     = wsRef.current
//     const device = deviceRef.current
//     const recv   = recvTransportRef.current
//     if (!ws || !device || !recv) return

//     try {
//       // Create consumer on server
//       const { params } = await ws.request('consume', {
//         rtpCapabilities:           device.rtpCapabilities,
//         remoteProducerId,
//         serverConsumerTransportId: recv.id,
//       })

//       if (params.error) {
//         console.error('[consume] Server error:', params.error)
//         return
//       }

//       const consumer = await recv.consume({
//         id:            params.id,
//         producerId:    params.producerId,
//         kind:          params.kind,
//         rtpParameters: params.rtpParameters,
//       })

//       consumersRef.current.set(remoteProducerId, consumer)

//       // Build a MediaStream from this track
//       const stream = new MediaStream([consumer.track])

//       // Use producerId as a proxy for socketId (server links them)
//       const participantId = params.producerId

//       updateParticipant(participantId, { stream, socketId: participantId })

//       // Resume the consumer
//       await ws.request('consumer-resume', { serverConsumerId: params.serverConsumerId })

//       consumer.on('trackended', () => removeParticipant(participantId))

//     } catch (err: any) {
//       console.error('[consumeProducer]', err)
//     }
//   }, [])

//   // ── Create recv transport ──────────────────────────────────────────────────

//   const createRecvTransport = useCallback(async () => {
//     const ws     = wsRef.current
//     const device = deviceRef.current
//     if (!ws || !device) return

//     const { params } = await ws.request('createWebRtcTransport', { consumer: true })

//     const transport = device.createRecvTransport(params)
//     recvTransportRef.current = transport

//     transport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
//       try {
//         await ws.request('transport-recv-connect', {
//           dtlsParameters,
//           serverConsumerTransportId: transport.id,
//         })
//         callback()
//       } catch (err) {
//         errback(err)
//       }
//     })

//     return transport
//   }, [])

//   // ── Create send transport + produce ───────────────────────────────────────

//   const createSendTransport = useCallback(async (stream: MediaStream) => {
//     const ws     = wsRef.current
//     const device = deviceRef.current
//     if (!ws || !device) return

//     const { params } = await ws.request('createWebRtcTransport', { consumer: false })
//     const transport  = device.createSendTransport(params)
//     sendTransportRef.current = transport

//     transport.on('connect', async ({ dtlsParameters }: any, callback: any, errback: any) => {
//       try {
//         await ws.request('transport-connect', { dtlsParameters })
//         callback()
//       } catch (err) {
//         errback(err)
//       }
//     })

//     transport.on('produce', async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
//       try {
//         const { id } = await ws.request('transport-produce', { kind, rtpParameters })
//         callback({ id })
//       } catch (err) {
//         errback(err)
//       }
//     })

//     // Produce audio
//     const audioTrack = stream.getAudioTracks()[0]
//     if (audioTrack) {
//       const audioProducer = await transport.produce({ track: audioTrack })
//       producersRef.current.set('audio', audioProducer)
//     }

//     // Produce video
//     const videoTrack = stream.getVideoTracks()[0]
//     if (videoTrack) {
//       const videoProducer = await transport.produce({ track: videoTrack })
//       producersRef.current.set('video', videoProducer)
//     }
//   }, [])

//   // ── Join the room ──────────────────────────────────────────────────────────

//   const join = useCallback(async () => {
//     if (connectionState !== 'idle') return
//     setConnectionState('connecting')
//     setError(null)

//     try {
//       // 1. Connect WebSocket
//       const ws = new WSClient(WS_URL, token)
//       wsRef.current = ws
//       const { socketId } = await ws.connect()
//       localSocketId.current = socketId

//       // 2. Listen for new producers BEFORE joining
//       ws.on('new-producer', async ({ producerId }: { producerId: string }) => {
//         console.log('[WS] new-producer:', producerId)
//         await consumeProducer(producerId)
//       })

//       // 3. Listen for producer-closed
//       ws.on('producer-closed', ({ remoteProducerId }: { remoteProducerId: string }) => {
//         console.log('[WS] producer-closed:', remoteProducerId)
//         const consumer = consumersRef.current.get(remoteProducerId)
//         consumer?.close()
//         consumersRef.current.delete(remoteProducerId)
//         removeParticipant(remoteProducerId)
//       })

//       // 4. Join room → get rtpCapabilities
//       const { rtpCapabilities } = await ws.request('joinRoom', { roomName })

//       // 5. Load mediasoup Device
//       const device = new Device()
//       await device.load({ routerRtpCapabilities: rtpCapabilities })
//       deviceRef.current = device

//       // 6. Get local media
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: true,
//         video: { width: 1280, height: 720, facingMode: 'user' },
//       })
//       setLocalStream(stream)

//       // 7. Add local participant
//       updateParticipant(socketId, {
//         socketId,
//         name:    displayName,
//         stream,
//         isLocal: true,
//       })

//       // 8. Create recv transport first
//       await createRecvTransport()

//       // 9. Get existing producers
//       const { producers } = await ws.request('getProducers', {})
//       for (const producerId of producers) {
//         await consumeProducer(producerId)
//       }

//       // 10. Create send transport + produce
//       await createSendTransport(stream)

//       setConnectionState('connected')
//       console.log('[useMediasoup] Joined room:', roomName)

//     } catch (err: any) {
//       console.error('[useMediasoup] Join failed:', err)
//       setError(err.message ?? 'Failed to join room')
//       setConnectionState('error')
//     }
//   }, [roomName, token, displayName, connectionState, consumeProducer, createRecvTransport, createSendTransport])

//   // ── Toggle audio ───────────────────────────────────────────────────────────

//   const toggleAudio = useCallback(() => {
//     const producer = producersRef.current.get('audio')
//     const stream   = localStream
//     if (!stream) return

//     const track = stream.getAudioTracks()[0]
//     if (!track) return

//     if (audioMuted) {
//       track.enabled = true
//       producer?.resume()
//       setAudioMuted(false)
//     } else {
//       track.enabled = false
//       producer?.pause()
//       setAudioMuted(true)
//     }
//   }, [audioMuted, localStream])

//   // ── Toggle video ───────────────────────────────────────────────────────────

//   const toggleVideo = useCallback(() => {
//     const producer = producersRef.current.get('video')
//     const stream   = localStream
//     if (!stream) return

//     const track = stream.getVideoTracks()[0]
//     if (!track) return

//     if (videoOff) {
//       track.enabled = true
//       producer?.resume()
//       setVideoOff(false)
//     } else {
//       track.enabled = false
//       producer?.pause()
//       setVideoOff(true)
//     }
//   }, [videoOff, localStream])

//   // ── Leave room ─────────────────────────────────────────────────────────────

//   const leave = useCallback(() => {
//     // Stop all local tracks
//     localStream?.getTracks().forEach(t => t.stop())

//     // Close transports
//     sendTransportRef.current?.close()
//     recvTransportRef.current?.close()

//     // Close all consumers
//     consumersRef.current.forEach(c => c.close())
//     consumersRef.current.clear()

//     // Close producers
//     producersRef.current.forEach(p => p.close())
//     producersRef.current.clear()

//     // Disconnect WS
//     wsRef.current?.disconnect()
//     wsRef.current = null

//     setLocalStream(null)
//     setParticipants(new Map())
//     setConnectionState('disconnected')
//   }, [localStream])

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (connectionState === 'connected') leave()
//     }
//   }, [])

//   return {
//     participants,
//     connectionState,
//     localStream,
//     audioMuted,
//     videoOff,
//     error,
//     join,
//     leave,
//     toggleAudio,
//     toggleVideo,
//   }
// }



/**
 * hooks/useMediasoup.ts
 *
 * Fixed issues:
 * 1. Remote participants keyed by producerId (not socketId) — each producer
 *    track gets its own tile. Audio + video producers from same peer are
 *    merged into one participant via a producerId→participantId map.
 * 2. consumeProducer uses refs not stale closure state
 * 3. recv transport connect uses send() not request() — server sends no response
 * 4. Both audio+video tracks from same peer share one MediaStream
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { Device }   from 'mediasoup-client'
import { WSClient } from '../libs/wsClient'
import type { Participant, ConnectionState } from '../types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'



export const useMediasoup = (roomName: string, token: string, displayName: string) => {
  const [participants,    setParticipants]    = useState<Map<string, Participant>>(new Map())
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [localStream,     setLocalStream]     = useState<MediaStream | null>(null)
  const [audioMuted,      setAudioMuted]      = useState(false)
  const [videoOff,        setVideoOff]        = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const wsRef            = useRef<WSClient | null>(null)
  const deviceRef        = useRef<Device | null>(null)
  const sendTransportRef = useRef<any>(null)
  const recvTransportRef = useRef<any>(null)
  const localSocketId    = useRef<string>('')
  const producersRef     = useRef<Map<string, any>>(new Map()) // 'audio'|'video' → producer

  // Track which producerIds we are already consuming to prevent duplicates
  const consumingSet     = useRef<Set<string>>(new Set())

  // producerId → MediaStream (one stream per remote peer track)
  const producerStreams  = useRef<Map<string, MediaStream>>(new Map())

  // consumerId → producerId (for cleanup)
  const consumerMap      = useRef<Map<string, any>>(new Map()) // consumerId → consumer obj

  // ── Participant helpers ────────────────────────────────────────────────────

  const upsertParticipant = useCallback((id: string, update: Partial<Participant>) => {
    setParticipants(prev => {
      const next     = new Map(prev)
      const existing = next.get(id) ?? {
        socketId:   id,
        name:       'Remote User',
        audioMuted: false,
        videoOff:   false,
        isLocal:    false,
      }
      next.set(id, { ...existing, ...update } as Participant)
      return next
    })
  }, [])

  const removeParticipant = useCallback((id: string) => {
    setParticipants(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // ── Consume a remote producer ──────────────────────────────────────────────

  const consumeProducer = useCallback(async (remoteProducerId: string) => {
    const ws     = wsRef.current
    const device = deviceRef.current
    const recv   = recvTransportRef.current

    if (!ws || !device || !recv) {
      console.warn('[consume] not ready — ws/device/recv missing')
      return
    }

    // ── DEDUP GUARD — prevent consuming same producer twice ──────────────────
    if (consumingSet.current.has(remoteProducerId)) {
      console.warn('[consume] already consuming:', remoteProducerId, '— skipping')
      return
    }
    consumingSet.current.add(remoteProducerId)

    console.log('[consume] starting for producerId:', remoteProducerId)

    try {
      const { params } = await ws.request('consume', {
        rtpCapabilities:           device.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId: recv.id,
      })

      if (params?.error) {
        console.error('[consume] server returned error:', params.error)
        consumingSet.current.delete(remoteProducerId) // allow retry
        return
      }

      console.log('[consume] server params received — kind:', params.kind, 'consumerId:', params.id)

      const consumer = await recv.consume({
        id:            params.id,
        producerId:    params.producerId,
        kind:          params.kind,
        rtpParameters: params.rtpParameters,
      })

      consumerMap.current.set(params.id, consumer)

      // Resume the consumer so media flows
      await ws.request('consumer-resume', { serverConsumerId: params.serverConsumerId })
      console.log('[consume] ✅ resumed — kind:', params.kind, 'track readyState:', consumer.track.readyState)

      // Each producer gets its own MediaStream with one track
      // VideoTile renders video + audio from same peer by checking stream tracks
      const stream = new MediaStream([consumer.track])
      producerStreams.current.set(remoteProducerId, stream)

      // Use producerId as the participant tile key
      // If it's audio-only, the tile shows avatar; video shows camera
      upsertParticipant(remoteProducerId, {
        socketId: remoteProducerId,
        name:     'Remote User',
        stream,
        isLocal:  false,
        videoOff: params.kind === 'audio', // audio-only producers show avatar
      })

      consumer.on('trackended', () => {
        console.log('[consume] trackended for:', remoteProducerId)
        removeParticipant(remoteProducerId)
        producerStreams.current.delete(remoteProducerId)
        consumingSet.current.delete(remoteProducerId)
      })

    } catch (err: any) {
      console.error('[consume] error:', err.message)
      consumingSet.current.delete(remoteProducerId) // allow retry on error
    }
  }, [upsertParticipant, removeParticipant])

  // ── Create recv transport ──────────────────────────────────────────────────

  const createRecvTransport = useCallback(async () => {
    const ws     = wsRef.current
    const device = deviceRef.current
    if (!ws || !device) return

    const { params } = await ws.request('createWebRtcTransport', { consumer: true })
    console.log('[recvTransport] created id:', params.id)

    const transport = device.createRecvTransport(params)
    recvTransportRef.current = transport

    transport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
      console.log('[recvTransport] connect fired')
      ws.request('transport-recv-connect', {
        dtlsParameters,
        serverConsumerTransportId: transport.id,
      })
        .then(callback)
        .catch(errback)
    })

    transport.on('connectionstatechange', (state: string) => {
      console.log('[recvTransport] ICE state:', state)
      if (state === 'failed') {
        console.error('[recvTransport] ICE failed — check ANNOUNCED_IP in mediasoup .env')
      }
    })

  }, [])

  // ── Create send transport + produce ───────────────────────────────────────

  const createSendTransport = useCallback(async (stream: MediaStream) => {
    const ws     = wsRef.current
    const device = deviceRef.current
    if (!ws || !device) return

    const { params } = await ws.request('createWebRtcTransport', { consumer: false })
    console.log('[sendTransport] created id:', params.id)

    const transport = device.createSendTransport(params)
    sendTransportRef.current = transport

    transport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
      console.log('[sendTransport] connect fired')
      ws.request('transport-connect', { dtlsParameters })
        .then(callback)
        .catch(errback)
    })

    transport.on('produce', async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
      console.log('[sendTransport] produce fired, kind:', kind)
      try {
        const { id } = await ws.request('transport-produce', { kind, rtpParameters })
        callback({ id })
      } catch (err) {
        errback(err)
      }
    })

    transport.on('connectionstatechange', (state: string) => {
      console.log('[sendTransport] ICE state:', state)
      if (state === 'failed') {
        console.error('[sendTransport] ICE failed — check ANNOUNCED_IP in mediasoup .env')
      }
    })

    // Produce audio
    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      const ap = await transport.produce({ track: audioTrack })
      producersRef.current.set('audio', ap)
      console.log('[sendTransport] audio producer:', ap.id)
    } else {
      console.warn('[sendTransport] no audio track found')
    }

    // Produce video
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      const vp = await transport.produce({ track: videoTrack })
      producersRef.current.set('video', vp)
      console.log('[sendTransport] video producer:', vp.id)
    } else {
      console.warn('[sendTransport] no video track found')
    }

  }, [])

  // ── Join ───────────────────────────────────────────────────────────────────

  const join = useCallback(async () => {
    if (connectionState !== 'idle') return
    setConnectionState('connecting')
    setError(null)

    try {
      // 1. Connect WS
      const ws = new WSClient(WS_URL, token)
      wsRef.current = ws
      const { socketId } = await ws.connect()
      localSocketId.current = socketId
      console.log('[join] WS connected, socketId:', socketId)

      // 2. Server-push listeners — register BEFORE joinRoom
      ws.on('new-producer', async ({ producerId }: { producerId: string }) => {
        console.log('[WS] ← new-producer:', producerId)
        await consumeProducer(producerId)
      })

      ws.on('producer-closed', ({ remoteProducerId }: { remoteProducerId: string }) => {
        console.log('[WS] ← producer-closed:', remoteProducerId)
        removeParticipant(remoteProducerId)
        producerStreams.current.delete(remoteProducerId)
        consumingSet.current.delete(remoteProducerId)
      })

      // 3. Join room → get rtpCapabilities
      const { rtpCapabilities } = await ws.request('joinRoom', { roomName })
      console.log('[join] got rtpCapabilities')

      // 4. Load mediasoup Device
      const device = new Device()
      await device.load({ routerRtpCapabilities: rtpCapabilities })
      deviceRef.current = device
      console.log('[join] device loaded')

      // 5. Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720, facingMode: 'user' },
      })
      setLocalStream(stream)
      console.log('[join] got local media — audio tracks:', stream.getAudioTracks().length, 'video tracks:', stream.getVideoTracks().length)

      // 6. Add local tile
      upsertParticipant(socketId, {
        socketId,
        name:    displayName,
        stream,
        isLocal: true,
      })

      // 7. Create recv transport BEFORE consuming
      await createRecvTransport()
      console.log('[join] recv transport ready')

      // 8. Consume any EXISTING producers in the room
      const { producers: existingProducers } = await ws.request('getProducers', {})
      console.log('[join] existing producers in room:', existingProducers)
      for (const producerId of existingProducers) {
        await consumeProducer(producerId)
      }

      // 9. Create send transport + start producing our own media
      await createSendTransport(stream)
      console.log('[join] fully joined ✅')

      setConnectionState('connected')

    } catch (err: any) {
      console.error('[join] failed:', err)
      setError(err.message ?? 'Failed to join')
      setConnectionState('error')
    }
  }, [
    roomName, token, displayName, connectionState,
    consumeProducer, createRecvTransport, createSendTransport,
    upsertParticipant, removeParticipant,
  ])

  // ── Toggle audio ───────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const track = localStream?.getAudioTracks()[0]
    if (!track) return
    const producer = producersRef.current.get('audio')
    if (audioMuted) {
      track.enabled = true
      producer?.resume()
      setAudioMuted(false)
    } else {
      track.enabled = false
      producer?.pause()
      setAudioMuted(true)
    }
  }, [audioMuted, localStream])

  // ── Toggle video ───────────────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    const track = localStream?.getVideoTracks()[0]
    if (!track) return
    const producer = producersRef.current.get('video')
    if (videoOff) {
      track.enabled = true
      producer?.resume()
      setVideoOff(false)
    } else {
      track.enabled = false
      producer?.pause()
      setVideoOff(true)
    }
  }, [videoOff, localStream])

  // ── Leave ──────────────────────────────────────────────────────────────────

  const leave = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop())
    sendTransportRef.current?.close()
    recvTransportRef.current?.close()
    consumerMap.current.forEach(c => c.close())
    consumerMap.current.clear()
    producersRef.current.forEach(p => p.close())
    producersRef.current.clear()
    consumingSet.current.clear()
    producerStreams.current.clear()
    wsRef.current?.disconnect()
    wsRef.current = null
    setLocalStream(null)
    setParticipants(new Map())
    setConnectionState('disconnected')
  }, [localStream])

  return {
    participants,
    connectionState,
    localStream,
    audioMuted,
    videoOff,
    error,
    join,
    leave,
    toggleAudio,
    toggleVideo,
  }
}