// Endpoint Verification Script
// Tests all parent-facing endpoints to verify connectivity
// Note: Requires Node.js 18+ for native fetch, or install node-fetch

import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import Student from '../models/Student'
import bcrypt from 'bcryptjs'

// For Node.js < 18, uncomment:
// import fetch from 'node-fetch'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api'

interface TestResult {
  endpoint: string
  method: string
  status: 'pass' | 'fail' | 'skip'
  error?: string
  responseTime?: number
}

const results: TestResult[] = []

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options: {
    token?: string
    body?: any
    expectedStatus?: number
  } = {}
): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
      },
      ...(options.body && { body: JSON.stringify(options.body) }),
    })

    const responseTime = Date.now() - startTime
    const status = response.status === (options.expectedStatus || 200) ? 'pass' : 'fail'

    if (status === 'fail') {
      const errorText = await response.text()
      return {
        endpoint,
        method,
        status: 'fail',
        error: `Expected ${options.expectedStatus || 200}, got ${response.status}: ${errorText}`,
        responseTime,
      }
    }

    return {
      endpoint,
      method,
      status: 'pass',
      responseTime,
    }
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 'fail',
      error: error.message,
      responseTime: Date.now() - startTime,
    }
  }
}

async function verifyEndpoints() {
  try {
    console.log('🔍 Starting endpoint verification...\n')

    // Connect to database
    await connectDB()
    console.log('✅ Connected to database\n')

    // Create or get test parent user
    let testParent = await User.findOne({ email: 'verify-test@educonnect.com' })
    if (!testParent) {
      const hashedPassword = await bcrypt.hash('test123', 10)
      testParent = await User.create({
        name: 'Test Parent',
        email: 'verify-test@educonnect.com',
        password: hashedPassword,
        role: 'parent',
      })
    }

    // Create or get test student
    let testStudent = await Student.findOne({ userId: String(testParent._id) })
    if (!testStudent) {
      testStudent = await Student.create({
        name: 'Test Student',
        studentId: 'TEST-001',
        gradeLevel: 10,
        userId: String(testParent._id),
      })
    }

    // Generate token
    const token = jwt.sign({ userId: String(testParent._id) }, JWT_SECRET, { expiresIn: '1h' })

    console.log('📝 Testing Authentication Endpoints...')
    // Test auth endpoints
    results.push(await testEndpoint('/auth/login', 'POST', {
      body: { email: 'verify-test@educonnect.com', password: 'test123' },
    }))
    results.push(await testEndpoint('/auth/me', 'GET', { token }))

    console.log('📝 Testing Student Endpoints...')
    // Test student endpoints
    results.push(await testEndpoint('/students', 'GET', { token }))
    results.push(await testEndpoint(`/students/${testStudent._id}`, 'GET', { token }))

    console.log('📝 Testing Academic Endpoints...')
    // Test academic endpoints
    results.push(await testEndpoint('/courses', 'GET', { token }))
    results.push(await testEndpoint('/enrollments', 'GET', { token }))
    results.push(await testEndpoint('/assignments', 'GET', { token }))
    results.push(await testEndpoint('/grades', 'GET', { token }))

    console.log('📝 Testing Communication Endpoints...')
    // Test communication
    results.push(await testEndpoint(`/alerts/${testStudent._id}`, 'GET', { token }))
    results.push(await testEndpoint('/messages', 'GET', { token }))
    results.push(await testEndpoint('/notices', 'GET', { token }))

    console.log('📝 Testing Analytics Endpoints...')
    // Test analytics
    results.push(await testEndpoint(`/performance/${testStudent._id}`, 'GET', { token }))
    results.push(await testEndpoint(`/engagement/${testStudent._id}`, 'GET', { token }))
    results.push(await testEndpoint(`/behavior-analysis/${testStudent._id}`, 'GET', { token }))
    results.push(await testEndpoint(`/optimal-study-time/${testStudent._id}`, 'GET', { token }))

    console.log('📝 Testing Schedule & Fees...')
    // Test schedule and fees
    results.push(await testEndpoint(`/attendance/${testStudent._id}`, 'GET', { token }))
    results.push(await testEndpoint(`/schedule/${testStudent._id}/weekly`, 'GET', { token }))
    results.push(await testEndpoint(`/fees/${testStudent._id}`, 'GET', { token }))

    // Print results
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICATION RESULTS')
    console.log('='.repeat(60) + '\n')

    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length

    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : '❌'
      const time = result.responseTime ? ` (${result.responseTime}ms)` : ''
      console.log(`${icon} ${result.method} ${result.endpoint}${time}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total: ${results.length}`)
    console.log('='.repeat(60) + '\n')

    if (failed > 0) {
      console.log('⚠️  Some endpoints failed. Check errors above.')
      process.exit(1)
    } else {
      console.log('🎉 All endpoints verified successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Verification error:', error)
    process.exit(1)
  } finally {
    await disconnectDB()
  }
}

// Run verification
verifyEndpoints()

