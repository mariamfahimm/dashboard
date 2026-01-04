// Database Configuration
import mongoose from 'mongoose'

/**
 * Connect to MongoDB database
 * Set DATABASE_URL or MONGO_URI in .env file
 * DATABASE_URL takes precedence over MONGO_URI
 */
export async function connectDB(): Promise<void> {
  try {
    // Support both DATABASE_URL and MONGO_URI (DATABASE_URL takes precedence)
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI
    
    if (!mongoUri) {
      throw new Error('DATABASE_URL or MONGO_URI environment variable must be set')
    }
    
    console.log('🔄 Attempting to connect to MongoDB...')
    console.log(`   URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`) // Hide password in logs
    
    // Set connection options
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 30000, // Timeout after 30s to allow time for IP whitelist propagation
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    }
    
    await mongoose.connect(mongoUri, options)
    console.log('✅ MongoDB connected successfully')
    console.log(`   Database: ${mongoose.connection.name}`)
    console.log(`   Host: ${mongoose.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    if (error instanceof Error) {
      console.error('   Error name:', error.name)
      console.error('   Error message:', error.message)
      
      // Provide helpful error messages
      if (error.message.includes('ENOTFOUND')) {
        console.error('   💡 Tip: Check your internet connection and MongoDB cluster URL')
      } else if (error.message.includes('authentication failed')) {
        console.error('   💡 Tip: Check your MongoDB username and password')
      } else if (error.message.includes('timeout')) {
        console.error('   💡 Tip: Check if MongoDB cluster allows connections from your IP')
      }
    }
    throw error
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect()
    console.log('✅ MongoDB disconnected')
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error)
    throw error
  }
}

