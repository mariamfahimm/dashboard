// Seed Demo Data for Student Emma
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import User from '../models/User'
import Attendance from '../models/Attendance'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config()

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

async function seedEmma(): Promise<void> {
  try {
    console.log('🌱 Starting seed script for Emma...\n')
    
    // Connect to database
    await connectDB()
    
    // Check if Emma already exists
    let emmaStudent = await Student.findOne({ name: /emma/i })
    let emmaParent = await User.findOne({ email: /emma/i, role: 'parent' }) || 
                     await User.findOne({ email: /emma/i, role: 'student' })
    
    // Create or find parent user for Emma
    if (!emmaParent) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      emmaParent = await User.create({
        name: 'Emma\'s Parent',
        email: 'emma.parent@educonnect.demo',
        password: hashedPassword,
        role: 'parent'
      })
      console.log('✅ Created parent user for Emma')
    } else {
      console.log('✅ Found existing parent user for Emma')
    }
    
    // Create or find Emma student
    if (!emmaStudent) {
      emmaStudent = await Student.create({
        name: 'Emma',
        nameArabic: 'إيما', // Arabic name
        studentId: 'STU-EMMA-001',
        gradeLevel: 10,
        userId: String(emmaParent._id)
      })
      console.log('✅ Created student: Emma (STU-EMMA-001)')
    } else {
      console.log('✅ Found existing student: Emma')
      
      // If Emma exists, delete existing grades and assignments to ensure clean data
      console.log('🗑️  Clearing existing grades and assignments for Emma...')
      const existingEnrollments = await Enrollment.find({ studentId: String(emmaStudent._id) })
      const existingCourseIds = existingEnrollments.map(e => e.courseId)
      
      // Delete existing grades
      const deletedGrades = await Grade.deleteMany({ studentId: String(emmaStudent._id) })
      console.log(`   Deleted ${deletedGrades.deletedCount} existing grades`)
      
      // Delete existing assignments for Emma's courses
      if (existingCourseIds.length > 0) {
        const deletedAssignments = await Assignment.deleteMany({ courseId: { $in: existingCourseIds } })
        console.log(`   Deleted ${deletedAssignments.deletedCount} existing assignments`)
      }
      
      // Update parent link if needed
      if (!emmaStudent.userId) {
        emmaStudent.userId = String(emmaParent._id)
        await emmaStudent.save()
        console.log('✅ Linked Emma to parent account')
      }
    }
    
    // Ensure emmaStudent is not null before proceeding
    if (!emmaStudent) {
      throw new Error('Failed to create or find Emma student')
    }
    
    // Create or find teacher user
    let teacherUser = await User.findOne({ email: 'demo-teacher@educonnect.demo' })
    if (!teacherUser) {
      const hashedPassword = await bcrypt.hash('demo123', 10)
      teacherUser = await User.create({
        name: 'Demo Teacher',
        email: 'demo-teacher@educonnect.demo',
        password: hashedPassword,
        role: 'teacher'
      })
      console.log('✅ Created demo teacher user')
    }
    
    // Create courses if they don't exist
    const subjects = ['Math', 'Science', 'English', 'History']
    const courses = []
    
    for (const subject of subjects) {
      let course = await Course.findOne({ subject })
      if (!course) {
        course = await Course.create({
          title: `${subject} 101`,
          description: `Demo ${subject} course for Emma`,
          teacherId: String(teacherUser._id),
          subject
        })
        console.log(`✅ Created course: ${subject}`)
      } else {
        console.log(`✅ Found existing course: ${subject}`)
      }
      courses.push(course)
    }
    
    // Create enrollments for Emma
    console.log('\n📚 Creating enrollments...')
    for (const course of courses) {
      const existingEnrollment = await Enrollment.findOne({
        studentId: String(emmaStudent._id),
        courseId: String(course._id)
      })
      
      if (!existingEnrollment) {
        await Enrollment.create({
          userId: String(emmaStudent.userId),
          studentId: String(emmaStudent._id),
          courseId: String(course._id),
          enrolledAt: weeksAgo(16), // Enrolled 16 weeks ago
          status: 'active'
        })
        console.log(`✅ Enrolled Emma in ${course.subject}`)
      } else {
        console.log(`✅ Emma already enrolled in ${course.subject}`)
      }
    }
    
    // Create comprehensive grades for all subjects - 14 weeks of historical data
    console.log('\n📊 Creating comprehensive grades (14 weeks of data)...')
    
    // Helper function to create grades for a subject with trend
    async function createSubjectGrades(
      course: any,
      subjectName: string,
      baseScores: number[], // Starting scores (oldest to newest)
      weeksBack: number = 14
    ) {
      if (!emmaStudent) {
        console.log(`⚠️  Emma student not found, skipping grades for ${subjectName}`)
        return 0
      }
      
      if (!emmaStudent) {
        console.log(`⚠️  Emma student not found, skipping grades for ${subjectName}`)
        return 0
      }
      
      const enrollment = await Enrollment.findOne({
        studentId: String(emmaStudent._id),
        courseId: String(course._id)
      })
      
      if (!enrollment) {
        console.log(`⚠️  No enrollment found for ${subjectName}, skipping grades`)
        return 0
      }
      
      let created = 0
      const scores = baseScores
      const studentId = String(emmaStudent._id)
      
      // Create 2 grades per week (homework + quiz/test)
      for (let week = weeksBack; week >= 0; week--) {
        const weekStart = weeksAgo(week)
        const weekEnd = weeksAgo(week - 0.5)
        
        // Calculate score for this week based on trend
        const progress = (weeksBack - week) / weeksBack
        const baseScore = baseScores[0]
        const targetScore = baseScores[baseScores.length - 1]
        const currentScore = baseScore + (targetScore - baseScore) * progress
        const variance = Math.random() * 4 - 2 // ±2 points variance
        
        // Create weekly assignment + quiz
        for (let i = 0; i < 2; i++) {
          const assignmentDate = i === 0 ? weekStart : weekEnd
          const score = Math.round(Math.max(0, Math.min(100, currentScore + variance + (i === 0 ? -1 : 1))))
          
          const assignment = await Assignment.create({
            courseId: String(course._id),
            title: `${subjectName} ${i === 0 ? 'Homework' : 'Quiz'} - Week ${weeksBack - week + 1}`,
            description: `${subjectName} ${i === 0 ? 'weekly homework' : 'assessment'}`,
            subject: subjectName,
            dueDate: assignmentDate,
            status: 'completed',
            createdAt: assignmentDate
          })
          
          await Grade.create({
            enrollmentId: String(enrollment._id),
            assignmentId: String(assignment._id),
            studentId: studentId,
            courseId: String(course._id),
            score: score,
            maxScore: 100,
            percentage: score,
            submittedAt: assignmentDate,
            gradedAt: new Date(assignmentDate.getTime() + 24 * 60 * 60 * 1000), // Graded 1 day later
            createdAt: assignmentDate
          })
          created++
        }
      }
      
      return created
    }
    
    // Math grades - improving trend: starts at 68%, ends at 82%
    const mathCourse = courses.find(c => c.subject === 'Math')
    if (mathCourse) {
      const mathGradesCreated = await createSubjectGrades(mathCourse, 'Math', [68, 70, 72, 75, 78, 80, 82], 14)
      console.log(`✅ Created ${mathGradesCreated} Math grades (improving trend: 68% → 82%)`)
    }
    
    // Science grades - stable with slight improvement: starts at 73%, ends at 78%
    const scienceCourse = courses.find(c => c.subject === 'Science')
    if (scienceCourse) {
      const scienceGradesCreated = await createSubjectGrades(scienceCourse, 'Science', [73, 74, 75, 76, 76, 77, 78], 14)
      console.log(`✅ Created ${scienceGradesCreated} Science grades (stable trend: 73% → 78%)`)
    }
    
    // English grades - excellent and improving: starts at 82%, ends at 92%
    const englishCourse = courses.find(c => c.subject === 'English')
    if (englishCourse) {
      const englishGradesCreated = await createSubjectGrades(englishCourse, 'English', [82, 84, 86, 87, 89, 90, 92], 14)
      console.log(`✅ Created ${englishGradesCreated} English grades (excellent trend: 82% → 92%)`)
    }
    
    // History grades - needs improvement: starts at 65%, ends at 75%
    const historyCourse = courses.find(c => c.subject === 'History')
    if (historyCourse) {
      const historyGradesCreated = await createSubjectGrades(historyCourse, 'History', [65, 67, 68, 70, 71, 73, 75], 14)
      console.log(`✅ Created ${historyGradesCreated} History grades (improving trend: 65% → 75%)`)
    }
    
    // Create pending and upcoming assignments
    console.log('\n📝 Creating assignments (completed, active, and upcoming)...')
    
    const assignmentsToCreate = [
      // Pending assignments
      { course: mathCourse, subject: 'Math', title: 'Math Homework - Algebra Review', description: 'Complete exercises 1-20 on page 45', dueDate: daysFromNow(3), status: 'active' },
      { course: scienceCourse, subject: 'Science', title: 'Science Lab Report', description: 'Write report on chemistry experiment', dueDate: daysFromNow(5), status: 'active' },
      { course: englishCourse, subject: 'English', title: 'English Essay - Literary Analysis', description: 'Analyze theme in assigned novel', dueDate: daysFromNow(7), status: 'active' },
      { course: historyCourse, subject: 'History', title: 'History Project - Research Paper', description: 'Research and write about Ancient Egypt', dueDate: daysFromNow(10), status: 'active' },
      
      // Upcoming assignments (next 2 weeks)
      { course: mathCourse, subject: 'Math', title: 'Math Quiz - Geometry', description: 'Chapter 8 geometry quiz', dueDate: daysFromNow(7), status: 'active' },
      { course: scienceCourse, subject: 'Science', title: 'Science Test - Biology', description: 'Mid-term biology examination', dueDate: daysFromNow(12), status: 'active' },
      { course: englishCourse, subject: 'English', title: 'English Reading Assignment', description: 'Read chapters 10-15 and write summary', dueDate: daysFromNow(4), status: 'active' },
      { course: historyCourse, subject: 'History', title: 'History Quiz - World War II', description: 'Quiz on WWII timeline and events', dueDate: daysFromNow(8), status: 'active' },
    ]
    
    for (const assignmentData of assignmentsToCreate) {
      if (assignmentData.course) {
        const existing = await Assignment.findOne({
          courseId: String(assignmentData.course._id),
          title: assignmentData.title,
          dueDate: assignmentData.dueDate
        })
        
        if (!existing) {
          await Assignment.create({
            courseId: String(assignmentData.course._id),
            title: assignmentData.title,
            description: assignmentData.description,
            subject: assignmentData.subject,
            dueDate: assignmentData.dueDate,
            status: assignmentData.status
          })
        }
      }
    }
    
    console.log(`✅ Created/verified ${assignmentsToCreate.length} assignments`)
    
    // Create attendance records (last 4 weeks)
    console.log('\n📅 Creating attendance records...')
    const attendanceDates = []
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) { // 5 school days per week
        const date = weeksAgo(4 - week)
        date.setDate(date.getDate() - day)
        if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
          attendanceDates.push(new Date(date))
        }
      }
    }
    
    let presentCount = 0
    for (const date of attendanceDates.slice(0, 15)) { // Last 15 school days
      const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late')
      if (status === 'present') presentCount++
      
      await Attendance.create({
        studentId: String(emmaStudent._id),
        date: date,
        status: status,
        notes: status === 'late' ? 'Arrived 10 minutes late' : undefined
      })
    }
    console.log(`✅ Created ${attendanceDates.length} attendance records (${presentCount} present)`)
    
    console.log('\n✅ Demo data seeded successfully for Emma!\n')
    
    // Print summary
    console.log('📊 Emma\'s Data Summary:')
    console.log('='.repeat(60))
    console.log(`\n👤 Student: Emma`)
    console.log(`   ID: ${emmaStudent._id}`)
    console.log(`   Student ID: ${emmaStudent.studentId}`)
    console.log(`   Grade Level: ${emmaStudent.gradeLevel}`)
    console.log(`   Parent: ${emmaParent.email}`)
    
    console.log('\n📚 Courses Enrolled:')
    for (const course of courses) {
      const gradeCount = await Grade.countDocuments({
        studentId: String(emmaStudent._id),
        courseId: String(course._id)
      })
      console.log(`   • ${course.subject}: ${gradeCount} grades`)
    }
    
    const totalGrades = await Grade.countDocuments({ studentId: String(emmaStudent._id) })
    const totalAssignments = await Assignment.countDocuments({
      courseId: { $in: courses.map(c => String(c._id)) }
    })
    const totalAttendance = await Attendance.countDocuments({ studentId: String(emmaStudent._id) })
    
    console.log('\n📈 Data Summary:')
    console.log(`   • Total Grades: ${totalGrades}`)
    console.log(`   • Total Assignments: ${totalAssignments}`)
    console.log(`   • Attendance Records: ${totalAttendance}`)
    
    console.log('\n🔗 API Endpoints:')
    const studentId = String(emmaStudent._id)
    console.log(`   • Performance: GET http://localhost:4000/api/performance/${studentId}`)
    console.log(`   • Insights: GET http://localhost:4000/api/performance/${studentId}/insights`)
    console.log(`   • Forecasts: GET http://localhost:4000/api/forecast/${studentId}`)
    console.log(`   • Recommendations: GET http://localhost:4000/api/parent-recommendations/${studentId}?language=en`)
    
    console.log('\n🎯 Grade Averages (14 weeks of data):')
    console.log('   • Math: ~75% (Strong improving trend: 68% → 82%)')
    console.log('   • Science: ~75.5% (Stable with slight improvement: 73% → 78%)')
    console.log('   • English: ~87% (Excellent and improving: 82% → 92%)')
    console.log('   • History: ~70% (Improving but needs attention: 65% → 75%)')
    console.log('\n📈 Data Quality:')
    console.log('   • 14 weeks of historical grades (28 grades per subject)')
    console.log('   • Clear trends visible for growth insights')
    console.log('   • Sufficient data points for ML predictions')
    console.log('   • Multiple assignments for completion rate analysis')
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Seed script completed successfully!')
    console.log('\n💡 Next Steps:')
    console.log('   1. Refresh your browser')
    console.log('   2. Select Emma from student dropdown')
    console.log('   3. View Learning Insights page')
    console.log('   4. View Academic Progress page')
    console.log('   5. ML insights should now be available!')
    
  } catch (error) {
    console.error('❌ Error seeding data for Emma:', error)
    throw error
  } finally {
    await disconnectDB()
  }
}

// Run seed script
if (require.main === module) {
  seedEmma()
    .then(() => {
      console.log('\n🎉 Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Seed script failed:', error)
      process.exit(1)
    })
}

export default seedEmma

