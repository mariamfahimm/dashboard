// Quick MongoDB Connection Test
require('dotenv').config()
const mongoose = require('mongoose')

async function testConnection() {
  const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL
  
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI or DATABASE_URL must be set in .env file')
    process.exit(1)
  }
  
  console.log('🔄 Testing MongoDB connection...')
  console.log(`URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    })
    console.log('✅ Connection successful!')
    console.log(`Database: ${mongoose.connection.name}`)
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()

