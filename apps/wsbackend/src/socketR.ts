/**
 * socketRegistry.ts
 *
 * Global in-memory map: socketId → ServerWebSocket
 *
 * This is how the Bun WS server pushes events (like 'new-producer' or
 * 'producer-closed') to specific clients — by looking up their socket here.
 *
 * Also maps socketId → roomName so the webhook handler can find all
 * peers in a room without calling mediasoup again.
 */

import type { ServerWebSocket } from 'bun'
import type { WSData }          from './index.js'

// socketId → WebSocket instance
const sockets = new Map<string, ServerWebSocket<WSData>>()

// socketId → roomName  (set when peer joins a room)
const socketRooms = new Map<string, string>()

// roomName → Set<socketId>  (fast room-level lookups)
const roomMembers = new Map<string, Set<string>>()

// ─── Socket Management ────────────────────────────────────────────────────────

export const registerSocket = (socketId: string, ws: ServerWebSocket<WSData>) => {
  sockets.set(socketId, ws)
}

export const unregisterSocket = (socketId: string) => {
  const roomName = socketRooms.get(socketId)
  if (roomName) {
    roomMembers.get(roomName)?.delete(socketId)
  }
  socketRooms.delete(socketId)
  sockets.delete(socketId)
}

export const getSocket = (socketId: string): ServerWebSocket<WSData> | undefined => {
  return sockets.get(socketId)
}

// ─── Room Management ──────────────────────────────────────────────────────────

export const joinRoom = (socketId: string, roomName: string) => {
  socketRooms.set(socketId, roomName)

  if (!roomMembers.has(roomName)) {
    roomMembers.set(roomName, new Set())
  }
  roomMembers.get(roomName)!.add(socketId)
}

export const getRoomForSocket = (socketId: string): string | undefined => {
  return socketRooms.get(socketId)
}

export const getRoomMembers = (roomName: string): string[] => {
  return Array.from(roomMembers.get(roomName) ?? [])
}

// ─── Push Helpers ─────────────────────────────────────────────────────────────

/**
 * Send a typed JSON message to a specific socket.
 */
export const sendTo = (socketId: string, type: string, payload: object) => {
  const ws = sockets.get(socketId)
  if (ws) {
    ws.send(JSON.stringify({ type, payload }))
  } else {
    console.warn(`[Registry] sendTo: socket ${socketId} not found`)
  }
}

/**
 * Send a typed JSON message to everyone in a room except the sender.
 */
export const broadcastToRoom = (
  roomName: string,
  excludeSocketId: string,
  type: string,
  payload: object
) => {
  const members = roomMembers.get(roomName) ?? new Set()
  members.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      sendTo(socketId, type, payload)
    }
  })
}