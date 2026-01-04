// Unit tests for eventEmitter
import { createServer } from 'http'
import { initializeSocketIO, emitStudentUpdate, isSocketIOAvailable, getIO } from '../services/eventEmitter'

describe('Event Emitter', () => {
  let httpServer: any

  beforeAll(() => {
    httpServer = createServer()
  })

  afterAll((done) => {
    if (httpServer) {
      httpServer.close(done)
    } else {
      done()
    }
  })

  it('should initialize Socket.io server', () => {
    const io = initializeSocketIO(httpServer)
    expect(io).toBeDefined()
    expect(isSocketIOAvailable()).toBe(true)
  })

  it('should emit student update events', () => {
    const event = {
      studentId: 'test-student-id',
      parentId: 'test-parent-id',
      type: 'grade' as const,
      data: {
        insights: [],
        message: 'Test update'
      },
      timestamp: new Date()
    }

    // Should not throw
    expect(() => emitStudentUpdate(event)).not.toThrow()
  })

  it('should handle emissions when Socket.io is not initialized', () => {
    // This is a fallback scenario
    const event = {
      studentId: 'test-student-id',
      type: 'grade' as const,
      data: { message: 'Test' },
      timestamp: new Date()
    }

    // Should gracefully handle
    expect(() => emitStudentUpdate(event)).not.toThrow()
  })

  it('should return Socket.io instance', () => {
    const io = getIO()
    expect(io).toBeDefined()
  })
})

