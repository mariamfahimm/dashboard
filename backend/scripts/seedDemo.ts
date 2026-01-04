// Demo Seed Script - Populates database with demo students and data
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import User from '../models/User'

// Load environment variables
dotenv.config()

// Safety check: Only run in development or with explicit flag
function checkEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === 'true'
  const mongoUri = process.env.MONGO_URI || ''
  
  // Check if this is a production database
  const isProduction = nodeEnv === 'production' || 
                       mongoUri.includes('production') ||
                       mongoUri.includes('prod')
  
  if (isProduction && !allowDemoSeed) {
    console.error('❌ ERROR: Cannot run seed script in production environment!')
    console.error('   Set ALLOW_DEMO_SEED=true to override (not recommended)')
    process.exit(1)
  }
  
  if (nodeEnv !== 'development' && !allowDemoSeed) {
    console.error('❌ ERROR: Seed script can only run in development environment!')
    console.error('   Set NODE_ENV=development or ALLOW_DEMO_SEED=true')
    process.exit(1)
  }
  
  console.log('✅ Environment check passed')
  console.log(`   NODE_ENV: ${nodeEnv || 'not set'}`)
  console.log(`   ALLOW_DEMO_SEED: ${allowDemoSeed}`)
}

// Helper to generate student ID
function generateStudentId(name: string, index: number): string {
  return `STU-DEMO-${index.toString().padStart(3, '0')}`
}

// Helper to get date N weeks ago
function weeksAgo(weeks: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - (weeks * 7))
  return date
}

// Helper to get date N days from now
function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

async function seedDemo(): Promise<void> {
  try {
    console.log('🌱 Starting demo seed script...\n')
    
    // Check environment
    checkEnvironment()
    
    // Connect to database
    await connectDB()
    
    // Clear demo data (only collections with demo prefix or specific demo students)
    console.log('\n🧹 Clearing existing demo data...')
    await Student.deleteMany({ studentId: /^STU-DEMO-/ })
    await Grade.deleteMany({ studentId: /^STU-DEMO-/ })
    await Assignment.deleteMany({ courseId: /^COURSE-DEMO-/ })
    await Enrollment.deleteMany({ studentId: /^STU-DEMO-/ })
    await Course.deleteMany({ _id: /^COURSE-DEMO-/ })
    console.log('✅ Demo data cleared\n')
    
    // Create demo teacher user (if doesn't exist)
    let teacherUser = await User.findOne({ email: 'demo-teacher@educonnect.demo' })
    if (!teacherUser) {
      teacherUser = await User.create({
        name: 'Demo Teacher',
        email: 'demo-teacher@educonnect.demo',
        password: 'demo123', // In production, this should be hashed
        role: 'teacher'
      })
      console.log('✅ Created demo teacher user')
    }
    
    // Create demo parent users
    const parentUsers = []
    const parentEmails = [
      'mariam.parent@educonnect.demo',
      'ahmed.parent@educonnect.demo',
      'laila.parent@educonnect.demo'
    ]
    
    for (const email of parentEmails) {
      let parent = await User.findOne({ email })
      if (!parent) {
        parent = await User.create({
          name: `Parent of ${email.split('.')[0]}`,
          email,
          password: 'demo123',
          role: 'student' // Parents use student role in this system
        })
      }
      parentUsers.push(parent)
    }
    console.log('✅ Created/verified demo parent users\n')
    
    // Create courses
    const courses = []
    const subjects = ['Math', 'Science', 'History', 'English']
    
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i]
      
      // Check if course exists, if not create
      let course = await Course.findOne({ subject })
      if (!course) {
        course = await Course.create({
          title: `${subject} 101`,
          description: `Demo ${subject} course`,
          teacherId: String(teacherUser._id),
          subject
        })
      }
      courses.push(course)
      console.log(`✅ Created/verified course: ${course.subject}`)
    }
    console.log('')
    
    // Create demo students
    const students = []
    const studentData = [
      {
        name: 'Mariam',
        gradeLevel: 10,
        parentUser: parentUsers[0],
        scenario: 'improving_math'
      },
      {
        name: 'Ahmed',
        gradeLevel: 9,
        parentUser: parentUsers[1],
        scenario: 'improving_science'
      },
      {
        name: 'Laila',
        gradeLevel: 11,
        parentUser: parentUsers[2],
        scenario: 'declining_history'
      }
    ]
    
    for (let i = 0; i < studentData.length; i++) {
      const data = studentData[i]
      const studentId = generateStudentId(data.name, i + 1)
      
      const student = await Student.create({
        name: data.name,
        studentId,
        gradeLevel: data.gradeLevel,
        userId: String(data.parentUser._id)
      })
      students.push({ student, ...data })
      console.log(`✅ Created student: ${data.name} (${studentId})`)
    }
    console.log('')
    
    // Create enrollments
    for (const { student } of students) {
      for (const course of courses) {
        await Enrollment.create({
          userId: String(student.userId),
          studentId: String(student._id),
          courseId: String(course._id),
          enrolledAt: weeksAgo(12),
          status: 'active'
        })
      }
    }
    console.log('✅ Created enrollments\n')
    
    // Create assignments and grades for Mariam (improving math scenario)
    const mariam = students.find(s => s.name === 'Mariam')
    const mathCourse = courses.find(c => c.subject === 'Math')
    
    if (mariam && mathCourse) {
      // Create 2 due assignments
      const assignment1 = await Assignment.create({
        courseId: String(mathCourse._id),
        title: 'Math Quiz - Algebra',
        description: 'Weekly algebra quiz',
        subject: 'Math',
        dueDate: daysFromNow(3),
        status: 'active'
      })
      
      const assignment2 = await Assignment.create({
        courseId: String(mathCourse._id),
        title: 'Math Homework - Functions',
        description: 'Practice problems on functions',
        subject: 'Math',
        dueDate: daysFromNow(7),
        status: 'active'
      })
      
      console.log('✅ Created assignments for Mariam')
      
      // Create 6 weekly grades (8, 9, 11, 10, 11, 11) - showing improvement
      const mariamGrades = [8, 9, 11, 10, 11, 11]
      const maxScore = 15
      
      for (let i = 0; i < mariamGrades.length; i++) {
        const score = mariamGrades[i]
        const submittedAt = weeksAgo(6 - i)
        
        await Grade.create({
          enrollmentId: String((await Enrollment.findOne({ 
            studentId: String(mariam.student._id),
            courseId: String(mathCourse._id)
          }))?._id),
          assignmentId: String(assignment1._id), // Reuse assignment for simplicity
          studentId: String(mariam.student._id),
          courseId: String(mathCourse._id),
          score: score,
          maxScore: maxScore,
          percentage: (score / maxScore) * 100,
          submittedAt: submittedAt,
          gradedAt: submittedAt
        })
      }
      
      console.log(`✅ Created ${mariamGrades.length} grades for Mariam (Math): ${mariamGrades.join(', ')}`)
    }
    
    // Create data for Ahmed (improving science)
    const ahmed = students.find(s => s.name === 'Ahmed')
    const scienceCourse = courses.find(c => c.subject === 'Science')
    
    if (ahmed && scienceCourse) {
      // Create grades showing upward trend: 65, 68, 72, 75, 78
      const ahmedGrades = [65, 68, 72, 75, 78]
      
      for (let i = 0; i < ahmedGrades.length; i++) {
        const score = ahmedGrades[i]
        const submittedAt = weeksAgo(5 - i)
        
        const assignment = await Assignment.create({
          courseId: String(scienceCourse._id),
          title: `Science Assessment ${i + 1}`,
          description: 'Weekly science assessment',
          subject: 'Science',
          dueDate: submittedAt,
          status: 'completed'
        })
        
        await Grade.create({
          enrollmentId: String((await Enrollment.findOne({ 
            studentId: String(ahmed.student._id),
            courseId: String(scienceCourse._id)
          }))?._id),
          assignmentId: String(assignment._id),
          studentId: String(ahmed.student._id),
          courseId: String(scienceCourse._id),
          score: score,
          maxScore: 100,
          percentage: score,
          submittedAt: submittedAt,
          gradedAt: submittedAt
        })
      }
      
      console.log(`✅ Created ${ahmedGrades.length} grades for Ahmed (Science): ${ahmedGrades.join(', ')}`)
    }
    
    // Create data for Laila (declining history)
    const laila = students.find(s => s.name === 'Laila')
    const historyCourse = courses.find(c => c.subject === 'History')
    
    if (laila && historyCourse) {
      // Create grades showing declining trend: 85, 82, 78, 75, 72
      const lailaGrades = [85, 82, 78, 75, 72]
      
      for (let i = 0; i < lailaGrades.length; i++) {
        const score = lailaGrades[i]
        const submittedAt = weeksAgo(5 - i)
        
        const assignment = await Assignment.create({
          courseId: String(historyCourse._id),
          title: `History Test ${i + 1}`,
          description: 'History assessment',
          subject: 'History',
          dueDate: submittedAt,
          status: 'completed'
        })
        
        await Grade.create({
          enrollmentId: String((await Enrollment.findOne({ 
            studentId: String(laila.student._id),
            courseId: String(historyCourse._id)
          }))?._id),
          assignmentId: String(assignment._id),
          studentId: String(laila.student._id),
          courseId: String(historyCourse._id),
          score: score,
          maxScore: 100,
          percentage: score,
          submittedAt: submittedAt,
          gradedAt: submittedAt
        })
      }
      
      console.log(`✅ Created ${lailaGrades.length} grades for Laila (History): ${lailaGrades.join(', ')}`)
    }
    
    console.log('\n✅ Demo data seeded successfully!\n')
    
    // Print summary
    console.log('📊 Demo Data Summary:')
    console.log('=' .repeat(60))
    console.log('\n👥 Students:')
    for (const { student, name } of students) {
      console.log(`   • ${name}`)
      console.log(`     ID: ${student._id}`)
      console.log(`     Student ID: ${student.studentId}`)
      console.log(`     View: http://localhost:5173/#/progress (select ${name})`)
    }
    
    console.log('\n📚 Courses:')
    for (const course of courses) {
      console.log(`   • ${course.subject}: ${course._id}`)
    }
    
    console.log('\n🔗 API Endpoints:')
    for (const { student, name } of students) {
      const studentId = String(student._id)
      console.log(`   • ${name}:`)
      console.log(`     - Performance: GET http://localhost:4000/api/performance/${studentId}`)
      console.log(`     - Insights: GET http://localhost:4000/api/performance/${studentId}/insights`)
      console.log(`     - Forecasts: GET http://localhost:4000/api/forecast/${studentId}`)
    }
    
    console.log('\n🎯 Mariam\'s Goal:')
    console.log('   Reach grade 15 in Math within 12 weeks')
    console.log('   Current grades: 8, 9, 11, 10, 11, 11 (out of 15)')
    console.log('   Current average: ~73.3% (target: 100% = 15/15)')
    console.log('   Trend: Improving')
    console.log('   Note: Forecast API expects targetGrade as percentage (0-100)')
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Seed script completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await disconnectDB()
  }
}

// Run seed script
if (require.main === module) {
  seedDemo()
    .then(() => {
      console.log('\n🎉 Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Seed script failed:', error)
      process.exit(1)
    })
}

export default seedDemo

