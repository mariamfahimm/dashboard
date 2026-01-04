/**
 * Seed Demo Data for All Grades (1-12)
 * Creates one student per grade level with varied data to test grade-aware UI
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
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL
if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI or DATABASE_URL must be set in .env file')
  process.exit(1)
}

// Type assertion after validation
const mongoUri: string = MONGO_URI

// Grade-appropriate course configurations
const getCoursesForGrade = (gradeLevel: number) => {
  if (gradeLevel <= 3) {
    // Early Primary: Simple subjects
    return [
      { title: 'Math Basics', subject: 'Math', description: 'Basic counting and numbers' },
      { title: 'Reading & Writing', subject: 'English', description: 'Alphabet and simple words' },
      { title: 'Science Fun', subject: 'Science', description: 'Nature and simple experiments' }
    ]
  } else if (gradeLevel <= 6) {
    // Upper Primary: More subjects
    return [
      { title: 'Mathematics', subject: 'Math', description: 'Numbers and operations' },
      { title: 'Language Arts', subject: 'English', description: 'Reading and writing' },
      { title: 'General Science', subject: 'Science', description: 'Science fundamentals' },
      { title: 'Social Studies', subject: 'Social', description: 'Community and history' }
    ]
  } else if (gradeLevel <= 9) {
    // Middle School: More specialized
    return [
      { title: 'Algebra', subject: 'Math', description: 'Algebraic concepts' },
      { title: 'Literature', subject: 'English', description: 'Reading comprehension' },
      { title: 'Biology', subject: 'Science', description: 'Life sciences' },
      { title: 'History', subject: 'History', description: 'World history' },
      { title: 'Geography', subject: 'Social', description: 'World geography' }
    ]
  } else {
    // Senior School: Advanced subjects
    return [
      { title: 'Advanced Mathematics', subject: 'Math', description: 'Calculus and advanced math' },
      { title: 'English Literature', subject: 'English', description: 'Literary analysis' },
      { title: 'Chemistry', subject: 'Chemistry', description: 'Chemical principles' },
      { title: 'Physics', subject: 'Physics', description: 'Physical principles' },
      { title: 'World History', subject: 'History', description: 'Historical analysis' }
    ]
  }
}

// Generate performance trend for a student (creates variety)
const generatePerformanceTrend = (gradeLevel: number, studentIndex: number, subjectIndex: number) => {
  // Create different patterns based on grade and student
  const baseScore = 70 + (studentIndex * 2) + (subjectIndex * 3)
  
  // Different trend patterns
  const patterns = [
    'improving',    // Gradually improving
    'declining',    // Gradually declining  
    'stable',       // Stable performance
    'volatile',     // Up and down
    'strong'        // Consistently strong
  ]
  
  const pattern = patterns[studentIndex % patterns.length]
  const weeks = gradeLevel <= 3 ? 8 : gradeLevel <= 6 ? 10 : gradeLevel <= 9 ? 12 : 14
  
  const scores = []
  for (let week = weeks; week >= 1; week--) {
    let score = baseScore
    
    switch (pattern) {
      case 'improving':
        score += (weeks - week) * 1.5 // Gradually improves
        break
      case 'declining':
        score -= (weeks - week) * 1.2 // Gradually declines
        break
      case 'stable':
        score += (Math.random() * 6 - 3) // Small variation
        break
      case 'volatile':
        score += Math.sin(week) * 8 + (Math.random() * 6 - 3) // Volatile
        break
      case 'strong':
        score += 15 + (Math.random() * 5 - 2.5) // Consistently high
        break
    }
    
    // Ensure score is within bounds
    score = Math.max(60, Math.min(98, score))
    scores.push(Math.round(score))
  }
  
  return scores
}

// Generate student name based on grade
const getStudentName = (gradeLevel: number) => {
  const names = [
    // Grade 1-3
    ['Jana', 'Ahmed', 'Layla', 'Omar', 'Nour'],
    // Grade 4-6
    ['Sara', 'Youssef', 'Mariam', 'Khaled', 'Fatima'],
    // Grade 7-9
    ['Aya', 'Mohamed', 'Dina', 'Ali', 'Zeinab'],
    // Grade 10-12
    ['Nada', 'Ahmed', 'Lina', 'Hassan', 'Yara']
  ]
  
  const nameGroup = gradeLevel <= 3 ? 0 : gradeLevel <= 6 ? 1 : gradeLevel <= 9 ? 2 : 3
  const index = gradeLevel % names[nameGroup].length
  return names[nameGroup][index]
}

async function seedAllGrades() {
  try {
    console.log('🌱 Starting seed for all grades (1-12)...\n')
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB\n')

    // Find or create parent user
    let parentUser = await User.findOne({ email: 'test@educonnect.com' })
    if (!parentUser) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      parentUser = await User.create({
        name: 'Test Parent',
        email: 'test@educonnect.com',
        password: hashedPassword,
        role: 'parent'
      })
      console.log('✅ Created parent user')
    } else {
      console.log('✅ Found parent user: test@educonnect.com')
    }

    const studentsCreated = []
    const studentsSkipped = []

    // Process each grade level
    for (let gradeLevel = 1; gradeLevel <= 12; gradeLevel++) {
      console.log(`\n📚 Processing Grade ${gradeLevel}...`)
      
      // Check if student already exists for this grade
      const existingStudent = await Student.findOne({ 
        gradeLevel,
        userId: parentUser._id 
      })
      
      if (existingStudent) {
        console.log(`   ⏭️  Student already exists for Grade ${gradeLevel}: ${existingStudent.name}`)
        studentsSkipped.push({ grade: gradeLevel, name: existingStudent.name })
        continue
      }

      // Create student
      const studentName = getStudentName(gradeLevel)
      const student = await Student.create({
        name: studentName,
        nameArabic: `${studentName} (Grade ${gradeLevel})`,
        studentId: `GRADE${gradeLevel}-${Date.now()}`,
        gradeLevel,
        userId: parentUser._id
      })
      console.log(`   ✅ Created student: ${studentName} (Grade ${gradeLevel})`)

      // Get courses for this grade level
      const courseData = getCoursesForGrade(gradeLevel)
      const courses = []
      
      for (const courseInfo of courseData) {
        // Create grade-specific course titles to avoid conflicts
        const gradeSpecificTitle = `${courseInfo.title} (Grade ${gradeLevel})`
        let course = await Course.findOne({ 
          title: gradeSpecificTitle,
          subject: courseInfo.subject 
        })
        
        if (!course) {
          course = await Course.create({
            title: gradeSpecificTitle,
            subject: courseInfo.subject,
            description: `${courseInfo.description} - Grade ${gradeLevel}`,
            teacherId: 'teacher1'
          })
        }
        courses.push(course)
      }
      console.log(`   ✅ Courses: ${courses.length}`)

      // Create enrollments (check if exists first to avoid duplicates)
      const enrollments = []
      for (const course of courses) {
        let enrollment = await Enrollment.findOne({
          studentId: student._id,
          courseId: course._id
        })
        
        if (!enrollment) {
          enrollment = await Enrollment.create({
            studentId: student._id,
            courseId: course._id,
            userId: parentUser._id,
            status: 'active',
            enrolledAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
          })
        }
        enrollments.push(enrollment)
      }
      console.log(`   ✅ Enrollments: ${enrollments.length}`)

      // Generate grades with varied performance
      const now = new Date()
      const weeks = gradeLevel <= 3 ? 8 : gradeLevel <= 6 ? 10 : gradeLevel <= 9 ? 12 : 14
      const grades = []
      const studentIndex = gradeLevel - 1 // For variation

      for (let week = weeks; week >= 1; week--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (week * 7))
        
        for (let subjectIdx = 0; subjectIdx < enrollments.length; subjectIdx++) {
          const enrollment = enrollments[subjectIdx]
          const course = courses[subjectIdx]
          
          // Generate performance trend
          const trendScores = generatePerformanceTrend(gradeLevel, studentIndex, subjectIdx)
          const score = trendScores[weeks - week]
          
          // Create 2 grades per week per subject
          for (let i = 0; i < 2; i++) {
            const gradeDate = new Date(weekStart)
            gradeDate.setDate(gradeDate.getDate() + (i * 3))
            
            // Add small variation to the score
            const finalScore = score + (Math.random() * 4 - 2)
            
            const grade = await Grade.create({
              enrollmentId: enrollment._id,
              studentId: student._id,
              courseId: course._id,
              assignmentId: `assignment-${week}-${i}`,
              score: Math.max(0, Math.min(100, finalScore)),
              maxScore: 100,
              percentage: Math.max(0, Math.min(100, finalScore)),
              submittedAt: gradeDate,
              gradedAt: new Date(gradeDate.getTime() + 60 * 60 * 1000)
            })
            grades.push(grade)
          }
        }
      }
      console.log(`   ✅ Grades: ${grades.length} (${weeks} weeks)`)

      // Create assignments
      const assignments = []
      for (let subjectIdx = 0; subjectIdx < enrollments.length; subjectIdx++) {
        const enrollment = enrollments[subjectIdx]
        const course = courses[subjectIdx]
        
        // Create 2-4 assignments per course depending on grade
        const numAssignments = gradeLevel <= 3 ? 2 : gradeLevel <= 6 ? 3 : 4
        
        for (let i = 0; i < numAssignments; i++) {
          const dueDate = new Date(now)
          dueDate.setDate(dueDate.getDate() + (i * 7) + 3)
          
          const assignment = await Assignment.create({
            courseId: course._id,
            title: `${course.subject} Assignment ${i + 1}`,
            description: `Assignment for ${course.subject}`,
            subject: course.subject,
            dueDate: dueDate,
            status: 'active'
          })
          assignments.push(assignment)
        }
      }
      console.log(`   ✅ Assignments: ${assignments.length}`)

      // Create attendance records
      const attendanceRecords = []
      const daysToSeed = gradeLevel <= 3 ? 30 : gradeLevel <= 6 ? 45 : 60
      
      for (let day = daysToSeed; day >= 0; day--) {
        const date = new Date(now)
        date.setDate(date.getDate() - day)
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue
        
        // Vary attendance (most students have good attendance)
        const attendanceRate = 0.92 + (studentIndex % 3) * 0.03 // 92-98% attendance
        const status = Math.random() > (1 - attendanceRate) 
          ? 'present' 
          : (Math.random() > 0.5 ? 'absent' : 'late')
        
        const attendance = await Attendance.create({
          studentId: student._id,
          date: date,
          status: status,
          notes: status === 'late' ? 'Arrived late' : undefined
        })
        attendanceRecords.push(attendance)
      }
      console.log(`   ✅ Attendance: ${attendanceRecords.length} records`)

      studentsCreated.push({ 
        grade: gradeLevel, 
        name: studentName,
        courses: courses.length,
        grades: grades.length,
        assignments: assignments.length
      })
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Seed Summary')
    console.log('='.repeat(60))
    
    if (studentsCreated.length > 0) {
      console.log('\n✅ Created Students:')
      studentsCreated.forEach(s => {
        console.log(`   Grade ${s.grade.toString().padStart(2)}: ${s.name.padEnd(10)} | ${s.courses} courses | ${s.grades} grades | ${s.assignments} assignments`)
      })
    }
    
    if (studentsSkipped.length > 0) {
      console.log('\n⏭️  Skipped (Already Exist):')
      studentsSkipped.forEach(s => {
        console.log(`   Grade ${s.grade.toString().padStart(2)}: ${s.name}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Total: ${studentsCreated.length} created, ${studentsSkipped.length} skipped`)
    console.log('\n🎯 All students are ready for testing!')
    console.log('   - Each student has different performance patterns')
    console.log('   - Grade modes will automatically adapt to grade level')
    console.log('   - Login with: test@educonnect.com / password123')

  } catch (error) {
    console.error('❌ Error seeding all grades:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  seedAllGrades()
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error)
      process.exit(1)
    })
}

export default seedAllGrades

