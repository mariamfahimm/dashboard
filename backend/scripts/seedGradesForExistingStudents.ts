/**
 * Seed Grades for Existing Students (Grades 1-3)
 * Adds grades to students that were created but don't have grade data
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

// Generate performance trend for a student
const generatePerformanceTrend = (gradeLevel: number, studentIndex: number, subjectIndex: number) => {
  const baseScore = 70 + (studentIndex * 2) + (subjectIndex * 3)
  const patterns = ['improving', 'declining', 'stable', 'volatile', 'strong']
  const pattern = patterns[studentIndex % patterns.length]
  const weeks = gradeLevel <= 3 ? 8 : gradeLevel <= 6 ? 10 : gradeLevel <= 9 ? 12 : 14
  
  const scores = []
  for (let week = weeks; week >= 1; week--) {
    let score = baseScore
    
    switch (pattern) {
      case 'improving':
        score += (weeks - week) * 1.5
        break
      case 'declining':
        score -= (weeks - week) * 1.2
        break
      case 'stable':
        score += (Math.random() * 6 - 3)
        break
      case 'volatile':
        score += Math.sin(week) * 8 + (Math.random() * 6 - 3)
        break
      case 'strong':
        score += 15 + (Math.random() * 5 - 2.5)
        break
    }
    
    score = Math.max(60, Math.min(98, score))
    scores.push(Math.round(score))
  }
  
  return scores
}

// Get courses for grade level
const getCoursesForGrade = (gradeLevel: number) => {
  if (gradeLevel <= 3) {
    return [
      { title: 'Math Basics', subject: 'Math', description: 'Basic counting and numbers' },
      { title: 'Reading & Writing', subject: 'English', description: 'Alphabet and simple words' },
      { title: 'Science Fun', subject: 'Science', description: 'Nature and simple experiments' }
    ]
  } else if (gradeLevel <= 6) {
    return [
      { title: 'Mathematics', subject: 'Math', description: 'Numbers and operations' },
      { title: 'Language Arts', subject: 'English', description: 'Reading and writing' },
      { title: 'General Science', subject: 'Science', description: 'Science fundamentals' },
      { title: 'Social Studies', subject: 'Social', description: 'Community and history' }
    ]
  }
  return []
}

async function seedGradesForExistingStudents() {
  try {
    console.log('🌱 Starting grade seeding for existing students (Grades 1-3)...\n')
    
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB\n')

    // Find parent user
    const parentUser = await User.findOne({ email: 'test@educonnect.com' })
    if (!parentUser) {
      throw new Error('Parent user not found')
    }

    // Find students in grades 1-3
    const students = await Student.find({ 
      gradeLevel: { $in: [1, 2, 3] },
      userId: parentUser._id 
    })

    if (students.length === 0) {
      console.log('⚠️  No students found in grades 1-3')
      return
    }

    console.log(`Found ${students.length} student(s) in grades 1-3\n`)

    for (const student of students) {
      console.log(`📚 Processing ${student.name} (Grade ${student.gradeLevel})...`)
      
      // Check if student already has grades
      const existingGrades = await Grade.countDocuments({ studentId: student._id })
      if (existingGrades > 0) {
        console.log(`   ⏭️  Student already has ${existingGrades} grades. Skipping...`)
        continue
      }

      // Get courses for this grade
      const courseData = getCoursesForGrade(student.gradeLevel)
      const courses = []
      
      for (const courseInfo of courseData) {
        const gradeSpecificTitle = `${courseInfo.title} (Grade ${student.gradeLevel})`
        let course = await Course.findOne({ 
          title: gradeSpecificTitle,
          subject: courseInfo.subject 
        })
        
        if (!course) {
          course = await Course.create({
            title: gradeSpecificTitle,
            subject: courseInfo.subject,
            description: `${courseInfo.description} - Grade ${student.gradeLevel}`,
            teacherId: 'teacher1'
          })
        }
        courses.push(course)
      }
      console.log(`   ✅ Courses: ${courses.length}`)

      // Create enrollments
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
            enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
          })
        }
        enrollments.push(enrollment)
      }
      console.log(`   ✅ Enrollments: ${enrollments.length}`)

      // Generate grades
      const now = new Date()
      const weeks = 8 // 8 weeks for early primary
      const grades = []
      const studentIndex = student.gradeLevel - 1

      for (let week = weeks; week >= 1; week--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (week * 7))
        
        for (let subjectIdx = 0; subjectIdx < enrollments.length; subjectIdx++) {
          const enrollment = enrollments[subjectIdx]
          const course = courses[subjectIdx]
          
          const trendScores = generatePerformanceTrend(student.gradeLevel, studentIndex, subjectIdx)
          const score = trendScores[weeks - week]
          
          // Create 2 grades per week per subject
          for (let i = 0; i < 2; i++) {
            const gradeDate = new Date(weekStart)
            gradeDate.setDate(gradeDate.getDate() + (i * 3))
            
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
      console.log(`   ✅ Created ${grades.length} grades`)

      // Create assignments
      const assignments = []
      for (let subjectIdx = 0; subjectIdx < enrollments.length; subjectIdx++) {
        const enrollment = enrollments[subjectIdx]
        const course = courses[subjectIdx]
        
        for (let i = 0; i < 2; i++) {
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
      console.log(`   ✅ Created ${assignments.length} assignments`)

      // Create attendance
      const attendanceRecords = []
      for (let day = 30; day >= 0; day--) {
        const date = new Date(now)
        date.setDate(date.getDate() - day)
        
        if (date.getDay() === 0 || date.getDay() === 6) continue
        
        const attendanceRate = 0.95
        const status = Math.random() > (1 - attendanceRate) ? 'present' : 'absent'
        
        const attendance = await Attendance.create({
          studentId: student._id,
          date: date,
          status: status
        })
        attendanceRecords.push(attendance)
      }
      console.log(`   ✅ Created ${attendanceRecords.length} attendance records`)
      console.log(`   ✅ Completed seeding for ${student.name}\n`)
    }

    console.log('✅ Grade seeding completed!')
    console.log('🎯 All students in grades 1-3 now have data')

  } catch (error) {
    console.error('❌ Error seeding grades:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run if called directly
if (require.main === module) {
  seedGradesForExistingStudents()
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error)
      process.exit(1)
    })
}

export default seedGradesForExistingStudents

