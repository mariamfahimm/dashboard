// Test setup file
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Load test environment variables
dotenv.config()

// Set test environment
process.env.NODE_ENV = 'test'

// Increase timeout for database operations
jest.setTimeout(60000) // 60 seconds

// Global test teardown
afterAll(async () => {
  // Close any open database connections
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
})

