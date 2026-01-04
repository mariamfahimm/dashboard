// MongoDB Database Setup Script
// Run with: node scripts/setupDatabase.js
// Or use: mongosh < scripts/setupDatabase.js

require('dotenv').config()
const { MongoClient } = require('mongodb')

const uri = process.env.MONGO_URI || process.env.DATABASE_URL
if (!uri) {
  console.error('❌ Error: MONGO_URI or DATABASE_URL must be set in .env file')
  process.exit(1)
}

async function setupDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db('educonnect')
    
    // Clear existing collections (optional - comment out if you want to keep existing data)
    // await db.collection('users').deleteMany({})
    // await db.collection('students').deleteMany({})
    // await db.collection('courses').deleteMany({})
    // await db.collection('enrollments').deleteMany({})
    // await db.collection('assignments').deleteMany({})
    // await db.collection('grades').deleteMany({})
    // await db.collection('alerts').deleteMany({})
    // await db.collection('recommendations').deleteMany({})
    
    // ============================================
    // 1. USERS COLLECTION
    // ============================================
    console.log('\n📝 Creating users...')
    const users = [
      {
        _id: 'user_teacher1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@educonnect.com',
        password: '$2b$10$example_hashed_password_teacher1', // TODO: Hash actual passwords
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_teacher2',
        name: 'Prof. Ahmed Hassan',
        email: 'ahmed.hassan@educonnect.com',
        password: '$2b$10$example_hashed_password_teacher2',
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_student1',
        name: 'Leila',
        email: 'leila@educonnect.com',
        password: '$2b$10$example_hashed_password_student1',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_student2',
        name: 'Omar',
        email: 'omar@educonnect.com',
        password: '$2b$10$example_hashed_password_student2',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_student3',
        name: 'Mariam',
        email: 'mariam@educonnect.com',
        password: '$2b$10$example_hashed_password_student3',
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_admin1',
        name: 'Admin User',
        email: 'admin@educonnect.com',
        password: '$2b$10$example_hashed_password_admin1',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('users').insertMany(users)
    console.log(`✅ Created ${users.length} users`)
    
    // ============================================
    // 2. STUDENTS COLLECTION (with performance & engagement)
    // ============================================
    console.log('\n📝 Creating students...')
    const students = [
      {
        _id: 'student_leila',
        name: 'Leila',
        studentId: 'leila',
        gradeLevel: 10,
        userId: 'user_student1',
        performance: {
          overallScore: 78,
          trend: 'improving',
          subjectBreakdown: [
            { subject: 'Math', score: 82, change: 5 },
            { subject: 'Science', score: 75, change: 2 },
            { subject: 'English', score: 88, change: 3 },
            { subject: 'Biology', score: 70, change: -1 }
          ],
          weeklyProgress: [
            { week: 'W1', score: 72 },
            { week: 'W2', score: 74 },
            { week: 'W3', score: 76 },
            { week: 'W4', score: 78 }
          ],
          riskLevel: 'low',
          lastUpdated: new Date()
        },
        engagement: {
          currentEngagement: 72,
          predictedEngagement: 78,
          engagementTrend: 'increasing',
          factors: [
            { factor: 'Time spent learning', impact: 12, weight: 0.3 },
            { factor: 'Assignment completion', impact: 8, weight: 0.25 },
            { factor: 'Active participation', impact: 5, weight: 0.2 },
            { factor: 'Platform interaction', impact: -3, weight: 0.15 },
            { factor: 'Peer collaboration', impact: 2, weight: 0.1 }
          ],
          sessionData: [
            { date: new Date('2024-01-15'), duration: 45, activities: 8, completionRate: 0.85 },
            { date: new Date('2024-01-16'), duration: 52, activities: 10, completionRate: 0.90 },
            { date: new Date('2024-01-17'), duration: 38, activities: 7, completionRate: 0.80 },
            { date: new Date('2024-01-18'), duration: 60, activities: 12, completionRate: 0.95 }
          ],
          lastActive: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'student_omar',
        name: 'Omar',
        studentId: 'omar',
        gradeLevel: 10,
        userId: 'user_student2',
        performance: {
          overallScore: 64,
          trend: 'improving',
          subjectBreakdown: [
            { subject: 'Math', score: 64, change: 3 },
            { subject: 'Science', score: 74, change: 6 },
            { subject: 'English', score: 79, change: 0 },
            { subject: 'Biology', score: 58, change: -2 }
          ],
          weeklyProgress: [
            { week: 'W1', score: 56 },
            { week: 'W2', score: 58 },
            { week: 'W3', score: 61 },
            { week: 'W4', score: 64 }
          ],
          riskLevel: 'medium',
          lastUpdated: new Date()
        },
        engagement: {
          currentEngagement: 69,
          predictedEngagement: 75,
          engagementTrend: 'increasing',
          factors: [
            { factor: 'Time spent learning', impact: 10, weight: 0.3 },
            { factor: 'Assignment completion', impact: 6, weight: 0.25 },
            { factor: 'Active participation', impact: 4, weight: 0.2 },
            { factor: 'Platform interaction', impact: -2, weight: 0.15 },
            { factor: 'Peer collaboration', impact: 1, weight: 0.1 }
          ],
          sessionData: [
            { date: new Date('2024-01-15'), duration: 40, activities: 6, completionRate: 0.75 },
            { date: new Date('2024-01-16'), duration: 48, activities: 8, completionRate: 0.82 },
            { date: new Date('2024-01-17'), duration: 35, activities: 5, completionRate: 0.70 },
            { date: new Date('2024-01-18'), duration: 55, activities: 10, completionRate: 0.88 }
          ],
          lastActive: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'student_mariam',
        name: 'Mariam',
        studentId: 'mariam',
        gradeLevel: 9,
        userId: 'user_student3',
        performance: {
          overallScore: 85,
          trend: 'stable',
          subjectBreakdown: [
            { subject: 'Math', score: 90, change: 2 },
            { subject: 'Science', score: 88, change: 1 },
            { subject: 'English', score: 92, change: 3 },
            { subject: 'Biology', score: 75, change: 0 }
          ],
          weeklyProgress: [
            { week: 'W1', score: 83 },
            { week: 'W2', score: 84 },
            { week: 'W3', score: 85 },
            { week: 'W4', score: 85 }
          ],
          riskLevel: 'low',
          lastUpdated: new Date()
        },
        engagement: {
          currentEngagement: 88,
          predictedEngagement: 90,
          engagementTrend: 'stable',
          factors: [
            { factor: 'Time spent learning', impact: 15, weight: 0.3 },
            { factor: 'Assignment completion', impact: 12, weight: 0.25 },
            { factor: 'Active participation', impact: 10, weight: 0.2 },
            { factor: 'Platform interaction', impact: 5, weight: 0.15 },
            { factor: 'Peer collaboration', impact: 8, weight: 0.1 }
          ],
          sessionData: [
            { date: new Date('2024-01-15'), duration: 55, activities: 12, completionRate: 0.95 },
            { date: new Date('2024-01-16'), duration: 60, activities: 14, completionRate: 0.98 },
            { date: new Date('2024-01-17'), duration: 50, activities: 11, completionRate: 0.92 },
            { date: new Date('2024-01-18'), duration: 65, activities: 15, completionRate: 0.99 }
          ],
          lastActive: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('students').insertMany(students)
    console.log(`✅ Created ${students.length} students`)
    
    // ============================================
    // 3. COURSES COLLECTION
    // ============================================
    console.log('\n📝 Creating courses...')
    const courses = [
      {
        _id: 'course_math101',
        title: 'Mathematics 101',
        description: 'Introduction to Algebra and Geometry',
        teacherId: 'user_teacher1',
        subject: 'Math',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        _id: 'course_science101',
        title: 'Science 101',
        description: 'General Science and Biology Fundamentals',
        teacherId: 'user_teacher2',
        subject: 'Science',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('courses').insertMany(courses)
    console.log(`✅ Created ${courses.length} courses`)
    
    // ============================================
    // 4. ENROLLMENTS COLLECTION
    // ============================================
    console.log('\n📝 Creating enrollments...')
    const enrollments = [
      {
        _id: 'enrollment_leila_math',
        userId: 'user_student1',
        studentId: 'leila',
        courseId: 'course_math101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      },
      {
        _id: 'enrollment_leila_science',
        userId: 'user_student1',
        studentId: 'leila',
        courseId: 'course_science101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      },
      {
        _id: 'enrollment_omar_math',
        userId: 'user_student2',
        studentId: 'omar',
        courseId: 'course_math101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      },
      {
        _id: 'enrollment_omar_science',
        userId: 'user_student2',
        studentId: 'omar',
        courseId: 'course_science101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      },
      {
        _id: 'enrollment_mariam_math',
        userId: 'user_student3',
        studentId: 'mariam',
        courseId: 'course_math101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      },
      {
        _id: 'enrollment_mariam_science',
        userId: 'user_student3',
        studentId: 'mariam',
        courseId: 'course_science101',
        enrolledAt: new Date('2024-01-05'),
        status: 'active',
        createdAt: new Date()
      }
    ]
    
    await db.collection('enrollments').insertMany(enrollments)
    console.log(`✅ Created ${enrollments.length} enrollments`)
    
    // ============================================
    // 5. ASSIGNMENTS COLLECTION
    // ============================================
    console.log('\n📝 Creating assignments...')
    const assignments = [
      {
        _id: 'assignment_math1',
        courseId: 'course_math101',
        title: 'Complete Problem Set 05',
        description: 'Solve algebraic equations from chapters 3-5',
        subject: 'Math',
        dueDate: new Date('2024-05-12'),
        status: 'active',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date()
      },
      {
        _id: 'assignment_science1',
        courseId: 'course_science101',
        title: 'Write Lab Report on Acid-Base Titration',
        description: 'Complete lab report with observations and analysis',
        subject: 'Science',
        dueDate: new Date('2024-05-12'),
        status: 'active',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('assignments').insertMany(assignments)
    console.log(`✅ Created ${assignments.length} assignments`)
    
    // ============================================
    // 6. GRADES COLLECTION
    // ============================================
    console.log('\n📝 Creating grades...')
    const grades = [
      // Leila's grades
      {
        _id: 'grade_leila_math1',
        enrollmentId: 'enrollment_leila_math',
        assignmentId: 'assignment_math1',
        studentId: 'leila',
        courseId: 'course_math101',
        score: 85,
        maxScore: 100,
        percentage: 85,
        submittedAt: new Date('2024-05-10'),
        gradedAt: new Date('2024-05-11'),
        createdAt: new Date()
      },
      {
        _id: 'grade_leila_science1',
        enrollmentId: 'enrollment_leila_science',
        assignmentId: 'assignment_science1',
        studentId: 'leila',
        courseId: 'course_science101',
        score: 78,
        maxScore: 100,
        percentage: 78,
        submittedAt: new Date('2024-05-10'),
        gradedAt: new Date('2024-05-11'),
        createdAt: new Date()
      },
      // Omar's grades
      {
        _id: 'grade_omar_math1',
        enrollmentId: 'enrollment_omar_math',
        assignmentId: 'assignment_math1',
        studentId: 'omar',
        courseId: 'course_math101',
        score: 72,
        maxScore: 100,
        percentage: 72,
        submittedAt: new Date('2024-05-09'),
        gradedAt: new Date('2024-05-11'),
        createdAt: new Date()
      },
      {
        _id: 'grade_omar_science1',
        enrollmentId: 'enrollment_omar_science',
        assignmentId: 'assignment_science1',
        studentId: 'omar',
        courseId: 'course_science101',
        score: 80,
        maxScore: 100,
        percentage: 80,
        submittedAt: new Date('2024-05-10'),
        gradedAt: new Date('2024-05-11'),
        createdAt: new Date()
      },
      // Mariam's grades
      {
        _id: 'grade_mariam_math1',
        enrollmentId: 'enrollment_mariam_math',
        assignmentId: 'assignment_math1',
        studentId: 'mariam',
        courseId: 'course_math101',
        score: 95,
        maxScore: 100,
        percentage: 95,
        submittedAt: new Date('2024-05-08'),
        gradedAt: new Date('2024-05-09'),
        createdAt: new Date()
      },
      {
        _id: 'grade_mariam_science1',
        enrollmentId: 'enrollment_mariam_science',
        assignmentId: 'assignment_science1',
        studentId: 'mariam',
        courseId: 'course_science101',
        score: 92,
        maxScore: 100,
        percentage: 92,
        submittedAt: new Date('2024-05-09'),
        gradedAt: new Date('2024-05-10'),
        createdAt: new Date()
      }
    ]
    
    await db.collection('grades').insertMany(grades)
    console.log(`✅ Created ${grades.length} grades`)
    
    // ============================================
    // 7. ALERTS COLLECTION
    // ============================================
    console.log('\n📝 Creating alerts...')
    const alerts = [
      {
        _id: 'alert_leila_1',
        type: 'performance',
        priority: 'medium',
        title: 'Performance Alert',
        message: 'Math score dropped by 8% this week - review recommended',
        studentId: 'leila',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionRequired: true,
        metadata: { subject: 'Math', previousScore: 85, currentScore: 77 }
      },
      {
        _id: 'alert_omar_1',
        type: 'achievement',
        priority: 'low',
        title: 'Milestone Reached',
        message: 'Completed 50 assignments this month! Great progress!',
        studentId: 'omar',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: true,
        actionRequired: false
      }
    ]
    
    await db.collection('alerts').insertMany(alerts)
    console.log(`✅ Created ${alerts.length} alerts`)
    
    // ============================================
    // 8. RECOMMENDATIONS COLLECTION
    // ============================================
    console.log('\n📝 Creating recommendations...')
    const recommendations = [
      {
        _id: 'rec_leila_1',
        category: 'study_plan',
        title: 'Focus on Biology Review',
        description: 'Spend 30 minutes daily on cellular biology concepts to improve your score',
        priority: 9,
        confidence: 0.87,
        studentId: 'leila',
        reasoning: 'Based on recent performance decline in Biology and your learning patterns',
        actionUrl: '/study/biology',
        metadata: { subject: 'Biology', duration: 30, frequency: 'daily' },
        accepted: false,
        dismissed: false,
        createdAt: new Date()
      },
      {
        _id: 'rec_omar_1',
        category: 'resource',
        title: 'Try Interactive Math Exercises',
        description: 'Engage with interactive problem-solving modules to boost Math performance',
        priority: 8,
        confidence: 0.82,
        studentId: 'omar',
        reasoning: 'Your Math scores improve significantly with interactive learning',
        actionUrl: '/resources/math/interactive',
        metadata: { resourceType: 'interactive', subject: 'Math' },
        accepted: false,
        dismissed: false,
        createdAt: new Date()
      }
    ]
    
    await db.collection('recommendations').insertMany(recommendations)
    console.log(`✅ Created ${recommendations.length} recommendations`)
    
    // ============================================
    // CREATE INDEXES
    // ============================================
    console.log('\n📝 Creating indexes...')
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ role: 1 })
    
    await db.collection('students').createIndex({ studentId: 1 }, { unique: true })
    await db.collection('students').createIndex({ userId: 1 })
    
    await db.collection('courses').createIndex({ teacherId: 1 })
    await db.collection('courses').createIndex({ subject: 1 })
    
    await db.collection('enrollments').createIndex({ userId: 1, courseId: 1 }, { unique: true })
    await db.collection('enrollments').createIndex({ studentId: 1 })
    await db.collection('enrollments').createIndex({ courseId: 1 })
    
    await db.collection('assignments').createIndex({ courseId: 1 })
    await db.collection('assignments').createIndex({ dueDate: 1 })
    
    await db.collection('grades').createIndex({ enrollmentId: 1, assignmentId: 1 }, { unique: true })
    await db.collection('grades').createIndex({ studentId: 1 })
    await db.collection('grades').createIndex({ courseId: 1 })
    
    await db.collection('alerts').createIndex({ studentId: 1, timestamp: -1 })
    await db.collection('alerts').createIndex({ read: 1 })
    
    await db.collection('recommendations').createIndex({ studentId: 1, createdAt: -1 })
    await db.collection('recommendations').createIndex({ accepted: 1, dismissed: 1 })
    
    console.log('✅ Created all indexes')
    
    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50))
    console.log('✅ DATABASE SETUP COMPLETE!')
    console.log('='.repeat(50))
    console.log('\nCollections created:')
    console.log(`  - users: ${await db.collection('users').countDocuments()}`)
    console.log(`  - students: ${await db.collection('students').countDocuments()}`)
    console.log(`  - courses: ${await db.collection('courses').countDocuments()}`)
    console.log(`  - enrollments: ${await db.collection('enrollments').countDocuments()}`)
    console.log(`  - assignments: ${await db.collection('assignments').countDocuments()}`)
    console.log(`  - grades: ${await db.collection('grades').countDocuments()}`)
    console.log(`  - alerts: ${await db.collection('alerts').countDocuments()}`)
    console.log(`  - recommendations: ${await db.collection('recommendations').countDocuments()}`)
    console.log('\n✅ All indexes created successfully!')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n✅ Database connection closed')
  }
}

// Run the setup
setupDatabase().catch(console.error)

