// Real-time Events Service (Socket.io Client)
import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

// Get base URL for Socket.io (remove /api if present)
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  // Socket.io needs the base server URL, not the API endpoint
  return envUrl.replace(/\/api\/?$/, '') || 'http://localhost:4000'
}

const API_BASE_URL = getBaseUrl()

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
  timestamp: string
}

type EventCallback = (event: StudentUpdateEvent) => void

class RealtimeService {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private listeners: Map<string, Set<EventCallback>> = new Map()

  /**
   * Initialize Socket.io connection
   */
  connect(token?: string | null): void {
    if (this.socket?.connected) {
      console.log('Socket.io already connected')
      return
    }

    try {
      this.socket = io(API_BASE_URL, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        console.log('✅ Socket.io connected:', this.socket?.id)
        this.isConnected = true
      })

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket.io disconnected:', reason)
        this.isConnected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error)
        this.isConnected = false
      })

      // Listen for student.update events
      this.socket.on('student.update', (event: StudentUpdateEvent) => {
        console.log('📡 Received student.update event:', event)
        this.notifyListeners('student.update', event)
      })
    } catch (error) {
      console.error('Failed to initialize Socket.io:', error)
      this.isConnected = false
    }
  }

  /**
   * Disconnect Socket.io
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  /**
   * Join a student room to receive updates for that student
   */
  joinStudentRoom(studentId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket.io not connected, cannot join student room')
      return
    }

    this.socket.emit('join:student', studentId)
    console.log(`📌 Joined student room: student:${studentId}`)
  }

  /**
   * Join a parent room to receive updates for all their children
   */
  joinParentRoom(parentId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket.io not connected, cannot join parent room')
      return
    }

    this.socket.emit('join:parent', parentId)
    console.log(`📌 Joined parent room: parent:${parentId}`)
  }

  /**
   * Leave a student room
   */
  leaveStudentRoom(studentId: string): void {
    if (!this.socket?.connected) return

    // Socket.io doesn't have explicit leave, but we can disconnect and reconnect
    // Or just stop listening to events for that student
    console.log(`📌 Left student room: student:${studentId}`)
  }

  /**
   * Subscribe to student.update events
   */
  onStudentUpdate(callback: EventCallback): () => void {
    if (!this.listeners.has('student.update')) {
      this.listeners.set('student.update', new Set())
    }

    this.listeners.get('student.update')!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get('student.update')
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(eventType: string, event: StudentUpdateEvent): void {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  /**
   * Check if Socket.io is connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  /**
   * Get Socket.io instance (for advanced usage)
   */
  get socketInstance(): Socket | null {
    return this.socket
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()

// Export hook for React components
export function useRealtime(studentId?: string, parentId?: string) {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<StudentUpdateEvent | null>(null)

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token')
    
    // Connect to Socket.io
    realtimeService.connect(token)

    // Update connection status
    const checkConnection = () => {
      setConnected(realtimeService.connected)
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 1000)

    // Join rooms if IDs provided
    if (studentId && realtimeService.connected) {
      realtimeService.joinStudentRoom(studentId)
    }
    if (parentId && realtimeService.connected) {
      realtimeService.joinParentRoom(parentId)
    }

    // Subscribe to updates
    const unsubscribe = realtimeService.onStudentUpdate((event) => {
      setLastUpdate(event)
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
      if (studentId) {
        realtimeService.leaveStudentRoom(studentId)
      }
    }
  }, [studentId, parentId])

  return {
    connected,
    lastUpdate,
    joinStudentRoom: (id: string) => realtimeService.joinStudentRoom(id),
    joinParentRoom: (id: string) => realtimeService.joinParentRoom(id),
  }
}


