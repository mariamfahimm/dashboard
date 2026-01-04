// Database Connection Validation Script
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'

// Load environment variables
dotenv.config()

async function validateConnection() {
  try {
    console.log('🔍 Validating MongoDB connection...')
    console.log('')
    
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL
    const mongoUri = process.env.MONGO_URI
    
    if (!dbUrl && !mongoUri) {
      console.error('❌ Error: DATABASE_URL or MONGO_URI must be set in .env file')
      process.exit(1)
    }
    
    const connectionString = dbUrl || mongoUri
    if (!connectionString) {
      console.error('❌ Error: DATABASE_URL or MONGO_URI must be set in .env file')
      process.exit(1)
    }
    console.log(`📋 Using: ${dbUrl ? 'DATABASE_URL' : 'MONGO_URI'}`)
    console.log(`🔗 Connection: ${connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)
    console.log('')
    
    // Attempt connection
    await connectDB()
    
    console.log('')
    console.log('✅ Connection validation successful!')
    console.log('')
    
    // Disconnect
    await disconnectDB()
    
    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Connection validation failed!')
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`)
    }
    console.error('')
    console.error('💡 Troubleshooting tips:')
    console.error('   1. Ensure MongoDB is running: docker compose up -d')
    console.error('   2. Check DATABASE_URL in .env file')
    console.error('   3. Verify MongoDB credentials match docker-compose.yml')
    console.error('')
    process.exit(1)
  }
}

validateConnection()

