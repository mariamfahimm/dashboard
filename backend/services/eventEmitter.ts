// Real-time Event Emitter Service
// Supports both Socket.io and fallback polling mechanism

import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

let io: SocketIOServer | null = null
let httpServer: HttpServer | null = null

export interface StudentUpdateEvent {
  studentId: string
  parentId?: string
  type: 'grade' | 'assignment' | 'insight' | 'forecast' | 'goal'
  data: {
    insights?: any[]
    forecasts?: any[]
    performance?: any
    goals?: any[]
    message?: string
  }
  timestamp: Date
}

/**
 * Initialize Socket.io server
 */
export function initializeSocketIO(server: HttpServer): SocketIOServer {
  httpServer = server
  
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io'
  })

  // Authentication middleware (simple token-based for demo)
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '')
    
    // In production, verify JWT token here
    // For demo, allow all connections
    if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_SEED === 'true') {
      return next()
    }
    
    // In production, verify token
    if (!token) {
      return next(new Error('Authentication required'))
    }
    
    // TODO: Verify JWT token
    next()
  })

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // Join student room
    socket.on('join:student', (studentId: string) => {
      socket.join(`student:${studentId}`)
      console.log(`📌 Client ${socket.id} joined student:${studentId}`)
    })

    // Join parent room
    socket.on('join:parent', (parentId: string) => {
      socket.join(`parent:${parentId}`)
      console.log(`📌 Client ${socket.id} joined parent:${parentId}`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })

  console.log('✅ Socket.io server initialized')
  return io
}

/**
 * Emit student update event
 */
export function emitStudentUpdate(event: StudentUpdateEvent): void {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized, event not emitted:', event.type)
    return
  }

  try {
    // Emit to student room
    io.to(`student:${event.studentId}`).emit('student.update', event)
    console.log(`📡 Emitted student.update to student:${event.studentId}`)

    // Emit to parent room if available
    if (event.parentId) {
      io.to(`parent:${event.parentId}`).emit('student.update', event)
      console.log(`📡 Emitted student.update to parent:${event.parentId}`)
    }
  } catch (error) {
    console.error('❌ Error emitting student update:', error)
  }
}

/**
 * Get Socket.io instance (for testing)
 */
export function getIO(): SocketIOServer | null {
  return io
}

/**
 * Check if Socket.io is available
 */
export function isSocketIOAvailable(): boolean {
  return io !== null
}

