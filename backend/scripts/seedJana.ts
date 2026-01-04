/**
 * Seed Demo Data for Jana (Grade 1 Student)
 * Creates appropriate data for Early Primary mode testing
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import Student from '../models/Student'
import User from '../models/User'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Attendance from '../models/Attendance'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL
if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI or DATABASE_URL must be set in .env file')
  process.exit(1)
}

// Type assertion after validation
const mongoUri: string = MONGO_URI

async function seedJana() {
  try {
    console.log('🌱 Starting seed for Jana (Grade 1)...')
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Find or create parent user
    let parentUser = await User.findOne({ email: 'test@educonnect.com' })
    if (!parentUser) {
      parentUser = await User.create({
        name: 'Test Parent',
        email: 'test@educonnect.com',
        password: '$2a$10$example', // This should be hashed, but for demo it's fine
        role: 'parent'
      })
      console.log('✅ Created parent user')
    }

    // Find or create Jana student
    let janaStudent = await Student.findOne({ name: 'Jana' })
    if (janaStudent) {
      console.log('🔄 Jana exists, cleaning up existing data...')
      // Delete existing grades and assignments for clean slate
      await Grade.deleteMany({ studentId: janaStudent._id })
      await Assignment.deleteMany({ courseId: { $in: await Enrollment.find({ studentId: janaStudent._id }).distinct('courseId') } })
    } else {
      janaStudent = await Student.create({
        name: 'Jana',
        nameArabic: 'جانا',
        studentId: `JANA${Date.now()}`,
        gradeLevel: 1, // Grade 1 for Early Primary mode
        userId: parentUser._id
      })
      console.log('✅ Created Jana student (Grade 1)')
    }

    // Create simple courses for Grade 1
    const courseNames = [
      { title: 'Math Basics', subject: 'Math', description: 'Basic counting and numbers' },
      { title: 'Reading & Writing', subject: 'English', description: 'Alphabet and simple words' },
      { title: 'Science Fun', subject: 'Science', description: 'Nature and simple experiments' },
      { title: 'Art & Colors', subject: 'Art', description: 'Drawing and colors' }
    ]

    const courses = []
    for (const courseData of courseNames) {
      let course = await Course.findOne({ 
        title: courseData.title,
        subject: courseData.subject 
      })
      
      if (!course) {
        course = await Course.create({
          title: courseData.title,
          subject: courseData.subject,
          description: courseData.description,
          teacherId: 'teacher1' // Default teacher
        })
      }
      courses.push(course)
      console.log(`✅ Course: ${course.subject} - ${course.title}`)
    }

    // Create enrollments
    const enrollments = []
    for (const course of courses) {
      let enrollment = await Enrollment.findOne({
        studentId: janaStudent._id,
        courseId: course._id
      })
      
      if (!enrollment) {
        enrollment = await Enrollment.create({
          studentId: janaStudent._id,
          courseId: course._id,
          userId: parentUser._id, // Required field
          status: 'active',
          enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
        })
      }
      enrollments.push(enrollment)
    }
    console.log('✅ Created enrollments')

    // Create simple grades for the last 8 weeks (2 per week per subject = 64 grades total)
    const now = new Date()
    const grades = []
    
    for (let week = 8; week >= 1; week--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (week * 7))
      
      for (const enrollment of enrollments) {
        const course = courses.find(c => String(c._id) === String(enrollment.courseId))
        if (!course) continue

        // Grade 1 students typically get simpler scoring (good/excellent/needs improvement)
        // Converting to percentages: 85-95% range for good performance, with some variation
        const baseScore = 88 + Math.random() * 7 // 88-95 range
        const score = Math.round(baseScore)
        
        // Create 2 grades per week per subject
        for (let i = 0; i < 2; i++) {
          const gradeDate = new Date(weekStart)
          gradeDate.setDate(gradeDate.getDate() + (i * 3))
          
          const grade = await Grade.create({
            enrollmentId: enrollment._id,
            studentId: janaStudent._id,
            courseId: course._id,
            assignmentId: `assignment-${week}-${i}`,
            score: score + (Math.random() * 4 - 2), // Small variation
            maxScore: 100,
            percentage: score + (Math.random() * 4 - 2),
            submittedAt: gradeDate,
            gradedAt: new Date(gradeDate.getTime() + 60 * 60 * 1000) // 1 hour after submission
          })
          grades.push(grade)
        }
      }
    }
    console.log(`✅ Created ${grades.length} grades for 8 weeks`)

    // Create simple assignments (age-appropriate)
    const assignments = []
    for (const enrollment of enrollments) {
      const course = courses.find(c => String(c._id) === String(enrollment.courseId))
      if (!course) continue

      // Create 2-3 assignments per course with simple titles
      const assignmentTitles = course.subject === 'Math' 
        ? ['Count to 20', 'Draw 5 circles', 'Number matching']
        : course.subject === 'English'
        ? ['Practice letters A-D', 'Read simple words', 'Color the picture']
        : course.subject === 'Science'
        ? ['Observe plants', 'Weather chart', 'Animal sounds']
        : ['Draw your family', 'Color mixing', 'Make a card']

      for (let i = 0; i < 2; i++) {
        const dueDate = new Date(now)
        dueDate.setDate(dueDate.getDate() + (i * 7) + 3) // Next 3 and 10 days
        
        const assignment = await Assignment.create({
          courseId: course._id,
          title: assignmentTitles[i] || `${course.subject} Activity ${i + 1}`,
          description: `Fun activity for ${course.subject.toLowerCase()}`,
          subject: course.subject,
          dueDate: dueDate,
          status: i === 0 ? 'active' : 'active' // Active assignments
        })
        assignments.push(assignment)
      }
    }
    console.log(`✅ Created ${assignments.length} assignments`)

    // Create attendance records (simple attendance for Grade 1)
    const attendanceRecords = []
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now)
      date.setDate(date.getDate() - day)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      // Grade 1 students typically have good attendance
      const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late')
      
      const attendance = await Attendance.create({
        studentId: janaStudent._id,
        date: date,
        status: status,
        notes: status === 'late' ? 'Arrived 10 minutes late' : undefined
      })
      attendanceRecords.push(attendance)
    }
    console.log(`✅ Created ${attendanceRecords.length} attendance records`)

    // Summary
    console.log('\n📊 Seed Summary for Jana:')
    console.log(`   Student: ${janaStudent.name} (Grade ${janaStudent.gradeLevel})`)
    console.log(`   Courses: ${courses.length}`)
    console.log(`   Enrollments: ${enrollments.length}`)
    console.log(`   Grades: ${grades.length}`)
    console.log(`   Assignments: ${assignments.length}`)
    console.log(`   Attendance Records: ${attendanceRecords.length}`)
    console.log('\n✅ Seed completed successfully!')
    console.log('\n🎯 Jana is ready for Early Primary mode testing!')
    console.log('   - Should see simplified language')
    console.log('   - No forecasts or complex analytics')
    console.log('   - Encouraging messages')
    console.log('   - Simple progress indicators')

  } catch (error) {
    console.error('❌ Error seeding Jana:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  seedJana()
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error)
      process.exit(1)
    })
}

export default seedJana

