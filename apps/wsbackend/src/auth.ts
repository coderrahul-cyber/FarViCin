/**
 * auth.ts
 *
 * Verifies the JWT token passed as a query param on WS connection.
 * e.g. wss://localhost:8080?token=eyJhbGci...
 *
 * Your JWT payload should include at minimum: { id, name }
 * matching your Prisma User model.
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTUser {
  id:   string
  name: string
}

/**
 * Returns the decoded user payload or null if invalid/expired.
 */
export const verifyToken = (token: string): JWTUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTUser
    return decoded
  } catch (err) {
    console.warn('[Auth] Invalid token:', err)
    return null
  }
}