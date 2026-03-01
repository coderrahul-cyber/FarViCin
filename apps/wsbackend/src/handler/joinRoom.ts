/**
 * handlers/joinRoom.ts
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from '../index.js'
import { prisma }               from '@repo/db/prisma'
import * as mediasoup           from '../mediasoupClient.js'
import { joinRoom as regJoin }  from '../socketR.js'

export const handleJoinRoom = async (
  ws: ServerWebSocket<WSData>,
  payload: { roomName: string }
) => {
  const { roomName } = payload
  const { socketId, user } = ws.data

  if (!roomName) {
    return ws.send(JSON.stringify({ type: 'error', payload: { message: 'roomName is required' } }))
  }

  // DB validation — skip with SKIP_DB_VALIDATION=true in .env for testing
  if (process.env.SKIP_DB_VALIDATION !== 'true') {
    try {
      const room = await prisma.room.findUnique({
        where: { slug: roomName },
        include: { users: true },
      })

      if (!room) {
        return ws.send(JSON.stringify({ type: 'error', payload: { message: `Room '${roomName}' not found` } }))
      }

      const isAdmin  = room.adminId === user.id
      const isMember = room.users.some((u: { id: string }) => u.id === user.id)

      if (!isAdmin && !isMember) {
        return ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not a member of this room' } }))
      }
    } catch (dbErr: any) {
      console.error('[joinRoom] DB error:', dbErr.message)
      return ws.send(JSON.stringify({ type: 'error', payload: { message: 'Database error — check DATABASE_URL' } }))
    }
  } else {
    console.warn('[joinRoom] ⚠️  DB validation skipped (SKIP_DB_VALIDATION=true)')
  }

  // Call mediasoup-server
  try {
    const { rtpCapabilities } = await mediasoup.createRoom(roomName, socketId)
   await regJoin(socketId, roomName)
    ws.send(JSON.stringify({ type: 'joinRoom-response', payload: { rtpCapabilities } }))
    console.log(`[joinRoom] ✅ ${user.name} (${socketId}) joined: ${roomName}`)
  } catch (err: any) {
    console.error('[joinRoom] mediasoup error:', err.message)
    ws.send(JSON.stringify({ type: 'error', payload: { message: `Failed to create room: ${err.message}` } }))
  }
}