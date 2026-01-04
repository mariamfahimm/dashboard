/**
 * Script to create demo accounts for focus group testing
 * 
 * This script creates 5 parent accounts with students of different age groups:
 * - Parent 1: Grade 2 (Ages 6-8)
 * - Parent 2: Grade 5 (Ages 9-11)
 * - Parent 3: Grade 7 (Ages 12-14)
 * - Parent 4: Grade 10 (Ages 15-17)
 * - Parent 5: Multiple children (Grades 3 & 8)
 * 
 * Run from backend directory: npm run seed:focus-group
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

import User from '../models/User'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Grade from '../models/Grade'
import Assignment from '../models/Assignment'
import Fee from '../models/Fee'
import bcrypt from 'bcryptjs'

// Focus group participants configuration
const FOCUS_GROUP_PARTICIPANTS = [
  {
    parent: {
      name: 'Ahmed Mohamed',
      email: 'focus.parent1@test.com',
      password: 'FocusTest2024!',
      role: 'parent' as const
    },
    student: {
      name: 'Omar Ahmed',
      nameArabic: 'عمر أحمد',
      studentId: 'FOCUS001',
      gradeLevel: 2, // Ages 6-8
      enrollments: ['Math', 'Science', 'English']
    }
  },
  {
    parent: {
      name: 'Fatima Ali',
      email: 'focus.parent2@test.com',
      password: 'FocusTest2024!',
      role: 'parent' as const
    },
    student: {
      name: 'Layla Fatima',
      nameArabic: 'ليلى فاطمة',
      studentId: 'FOCUS002',
      gradeLevel: 5, // Ages 9-11
      enrollments: ['Math', 'Science', 'English', 'History']
    }
  },
  {
    parent: {
      name: 'Mahmoud Hassan',
      email: 'focus.parent3@test.com',
      password: 'FocusTest2024!',
      role: 'parent' as const
    },
    student: {
      name: 'Youssef Mahmoud',
      nameArabic: 'يوسف محمود',
      studentId: 'FOCUS003',
      gradeLevel: 7, // Ages 12-14
      enrollments: ['Math', 'Science', 'English', 'History', 'Geography']
    }
  },
  {
    parent: {
      name: 'Nour Ibrahim',
      email: 'focus.parent4@test.com',
      password: 'FocusTest2024!',
      role: 'parent' as const
    },
    student: {
      name: 'Mariam Nour',
      nameArabic: 'مريم نور',
      studentId: 'FOCUS004',
      gradeLevel: 10, // Ages 15-17
      enrollments: ['Math', 'Science', 'English', 'History', 'Physics', 'Chemistry']
    }
  },
  {
    parent: {
      name: 'Khaled Samir',
      email: 'focus.parent5@test.com',
      password: 'FocusTest2024!',
      role: 'parent' as const
    },
    students: [ // Multi-child parent
      {
        name: 'Amira Khaled',
        nameArabic: 'أميرة خالد',
        studentId: 'FOCUS005A',
        gradeLevel: 3,
        enrollments: ['Math', 'Science', 'English']
      },
      {
        name: 'Mohamed Khaled',
        nameArabic: 'محمد خالد',
        studentId: 'FOCUS005B',
        gradeLevel: 8,
        enrollments: ['Math', 'Science', 'English', 'History']
      }
    ]
  }
]

const COURSES = [
  { title: 'Mathematics 101', subject: 'Math', description: 'Elementary Mathematics' },
  { title: 'Science 101', subject: 'Science', description: 'General Science' },
  { title: 'English Language', subject: 'English', description: 'English Language and Literature' },
  { title: 'History 101', subject: 'History', description: 'World History' },
  { title: 'Geography', subject: 'Geography', description: 'World Geography' },
  { title: 'Physics 101', subject: 'Physics', description: 'General Physics' },
  { title: 'Chemistry 101', subject: 'Chemistry', description: 'General Chemistry' }
]

async function generateGrades(studentId: string, courseId: string, weeks: number = 6) {
  const grades = []
  const baseScores = [75, 80, 85, 82, 78, 88, 90, 85] // Base scores with variation
  
  for (let week = 0; week < weeks; week++) {
    // 2-3 grades per week
    const gradesPerWeek = Math.floor(Math.random() * 2) + 2
    
    for (let i = 0; i < gradesPerWeek; i++) {
      const baseScore = baseScores[Math.floor(Math.random() * baseScores.length)]
      const variation = Math.floor(Math.random() * 15) - 5 // -5 to +10 variation
      const score = Math.max(50, Math.min(100, baseScore + variation))
      const maxScore = 100
      
      const submissionDate = new Date()
      submissionDate.setDate(submissionDate.getDate() - (weeks - week) * 7 - (gradesPerWeek - i - 1) * 2)
      
      // Create assignment first
      const assignment = await Assignment.create({
        courseId,
        title: `Assignment ${week + 1}.${i + 1}`,
        subject: (await Course.findById(courseId))?.subject || 'General',
        dueDate: submissionDate,
        status: 'completed'
      })
      
      const enrollment = await Enrollment.findOne({ studentId, courseId })
      if (!enrollment) continue
      
      const grade = {
        enrollmentId: String(enrollment._id),
        assignmentId: String(assignment._id),
        studentId,
        courseId,
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        submittedAt: submissionDate,
        gradedAt: submissionDate
      }
      
      grades.push(grade)
    }
  }
  
  return grades
}

async function seedFocusGroup() {
  try {
    console.log('🌱 Starting Focus Group Account Setup...\n')
    
    // Connect to database
    const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('DATABASE_URL or MONGO_URI not found in environment variables')
    }
    
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to database\n')
    
    // Clean up existing focus group accounts (optional - comment out if you want to keep)
    console.log('🧹 Cleaning up existing focus group accounts...')
    await User.deleteMany({ email: /focus\.parent\d@test\.com/ })
    await Student.deleteMany({ studentId: /^FOCUS\d+/ })
    console.log('✅ Cleanup complete\n')
    
    // Create or get courses
    console.log('📚 Setting up courses...')
    const courseMap = new Map<string, string>()
    
    for (const courseData of COURSES) {
      let course = await Course.findOne({ subject: courseData.subject })
      if (!course) {
        course = await Course.create({
          ...courseData,
          teacherId: 'teacher1'
        })
        console.log(`   Created course: ${courseData.subject}`)
      } else {
        console.log(`   Found existing course: ${courseData.subject}`)
      }
      courseMap.set(courseData.subject, String(course._id))
    }
    console.log('✅ Courses ready\n')
    
    // Create parent accounts and students
    for (let i = 0; i < FOCUS_GROUP_PARTICIPANTS.length; i++) {
      const participant = FOCUS_GROUP_PARTICIPANTS[i]
      console.log(`\n👤 Setting up Parent ${i + 1}: ${participant.parent.name}`)
      
      // Create parent user
      const hashedPassword = await bcrypt.hash(participant.parent.password, 10)
      const parent = await User.create({
        ...participant.parent,
        password: hashedPassword
      })
      console.log(`   ✅ Created parent account: ${participant.parent.email}`)
      
      // Handle single or multiple students
      const studentsToCreate = participant.students || [participant.student]
      
      for (const studentData of studentsToCreate) {
        console.log(`   👨‍🎓 Setting up student: ${studentData.name} (Grade ${studentData.gradeLevel})`)
        
        // Create student
        const student = await Student.create({
          ...studentData,
          userId: String(parent._id)
        })
        console.log(`      ✅ Created student: ${studentData.name}`)
        
        // Create enrollments
        for (const subject of studentData.enrollments) {
          const courseId = courseMap.get(subject)
          if (!courseId) {
            console.log(`      ⚠️  Course not found: ${subject}`)
            continue
          }
          
          const enrollment = await Enrollment.create({
            studentId: String(student._id),
            courseId,
            status: 'active'
          })
          console.log(`      ✅ Enrolled in ${subject}`)
          
          // Generate grades (6 weeks of data)
          const grades = await generateGrades(String(student._id), courseId, 6)
          if (grades.length > 0) {
            await Grade.insertMany(grades)
            console.log(`      ✅ Generated ${grades.length} grades for ${subject}`)
          }
        }
        
        // Create a few assignments (mix of completed and pending)
        const studentCourses = studentData.enrollments.map(s => courseMap.get(s)!).filter(Boolean)
        for (let j = 0; j < 8; j++) {
          const courseId = studentCourses[Math.floor(Math.random() * studentCourses.length)]
          const daysFromNow = Math.floor(Math.random() * 30) - 10 // -10 to +20 days
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + daysFromNow)
          
          const status = daysFromNow < 0 ? 'completed' : daysFromNow < 7 ? 'active' : 'active'
          
          await Assignment.create({
            courseId,
            title: `Assignment ${j + 1}`,
            subject: (await Course.findById(courseId))?.subject || 'General',
            dueDate,
            status
          })
        }
        console.log(`      ✅ Created 8 assignments`)
        
        // Create a fee
        await Fee.create({
          studentId: String(student._id),
          description: 'Tuition Fee - Semester 1',
          amount: 1500,
          feeType: 'tuition',
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
        console.log(`      ✅ Created fee record`)
      }
    }
    
    console.log('\n✅ Focus Group Accounts Setup Complete!\n')
    console.log('📋 Account Credentials:')
    console.log('='.repeat(50))
    FOCUS_GROUP_PARTICIPANTS.forEach((p, i) => {
      console.log(`\nParent ${i + 1}: ${p.parent.name}`)
      console.log(`  Email: ${p.parent.email}`)
      console.log(`  Password: ${p.parent.password}`)
    })
    console.log('\n' + '='.repeat(50))
    console.log('\n✅ All accounts are ready for focus group testing!')
    
  } catch (error) {
    console.error('❌ Error setting up focus group accounts:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Database connection closed')
  }
}

// Run if called directly
if (require.main === module) {
  seedFocusGroup()
    .then(() => {
      console.log('\n✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error)
      process.exit(1)
    })
}

export default seedFocusGroup

