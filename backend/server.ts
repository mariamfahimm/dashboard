// Express Server
// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import path from 'path'
import { createServer } from 'http'
import { connectDB } from './config/db'
import apiRoutes from './routes/index'
import { AppError, handleError } from './utils/errors'
import { initializeSocketIO } from './services/eventEmitter'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 4000

// Initialize Socket.io for real-time events
initializeSocketIO(httpServer)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// API Routes
app.use('/api', apiRoutes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  handleError(err, res)
})

// Start server
async function startServer() {
  try {
    console.log('🔄 Starting server...')
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔌 Port: ${PORT}`)
    
    // Connect to database
    console.log('🔄 Connecting to MongoDB...')
    await connectDB()
    
    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`📡 API endpoints: http://localhost:${PORT}/api`)
      console.log(`🔌 Socket.io available at ws://localhost:${PORT}/socket.io`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    process.exit(1)
  }
}

startServer()

