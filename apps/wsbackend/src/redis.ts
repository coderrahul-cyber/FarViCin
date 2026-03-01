/**
 * src/redis.ts
 *
 * Two Redis clients — this is required because Redis pub/sub is stateful:
 * once a connection enters SUBSCRIBE mode it can ONLY subscribe/unsubscribe.
 * Any SET/GET/PUBLISH must use a separate connection.
 *
 *   pub  → all regular commands (SET, GET, SADD, SREM, DEL, PUBLISH)
 *   sub  → only SUBSCRIBE / message handling
 *
 * Key schema:
 *   socket:{socketId}         → STRING  which WS node owns this socket
 *   socket:room:{socketId}    → STRING  which room this socket is in
 *   room:members:{roomName}   → SET     all socketIds in a room
 *
 * Pub/Sub channels:
 *   room:{roomName}           → broadcast events to all nodes in this room
 */

import { RedisClient } from 'bun'

const url = process.env.REDIS_URL || 'redis://:videocall_secret@127.0.0.1:6379'

// Regular commands client
export const pub = new RedisClient(url)

// Subscribe-only client  
export const sub = new RedisClient(url)

// Centralised key names — change once, applies everywhere
export const K = {
  socket:      (id: string)   => `socket:${id}`,
  socketRoom:  (id: string)   => `socket:room:${id}`,
  roomMembers: (room: string) => `room:members:${room}`,
  roomChannel: (room: string) => `room:${room}`,
}

// TTLs in seconds
export const TTL = {
  socket: 3600,   // 1 hour — auto-expire if close event missed
  room:   86400,  // 24 hours
}

export const connectRedis = async () => {
  try {
    await pub.connect()
    await sub.connect()
    // Quick smoke test
    const pong = await pub.send('PING', [])
    console.log(`[Redis] Connected — PING → ${pong}`)
  } catch (err: any) {
    console.error('[Redis] Failed to connect:', err.message)
    console.error('[Redis] Start Redis with: docker compose up -d  (inside redis/ folder)')
    process.exit(1)
  }
}