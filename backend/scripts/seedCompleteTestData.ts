// Comprehensive Test Data Seeding Script
// Populates database with complete test data for all components

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB, disconnectDB } from '../config/db'
import User from '../models/User'
import Student from '../models/Student'
import Course from '../models/Course'
import Enrollment from '../models/Enrollment'
import Assignment from '../models/Assignment'
import Grade from '../models/Grade'
import Event from '../models/Event'
import Message from '../models/Message'
import Notice from '../models/Notice'
import Goal from '../models/Goal'
import Alert from '../models/Alert'
import Schedule from '../models/Schedule'
import Fee from '../models/Fee'
import bcrypt from 'bcryptjs'

dotenv.config()

// Helper functions
function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function seedCompleteTestData(): Promise<void> {
  try {
    console.log('🌱 Starting comprehensive test data seeding...\n')
    
    // Connect to database
    await connectDB()
    console.log('✅ Connected to database\n')
    
    // Get or create test user
    console.log('📝 Step 1: Creating/verifying test user...')
    let testUser = await User.findOne({ email: 'test@educonnect.com' })
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      testUser = await User.create({
        name: 'Test Parent',
        email: 'test@educonnect.com',
        password: hashedPassword,
        role: 'parent'
      })
      console.log('✅ Created test user')
    } else {
      console.log('✅ Test user already exists')
    }
    const userId = String(testUser._id)
    console.log('')
    
    // Create students
    console.log('📝 Step 2: Creating students...')
    const studentNames = ['Emma', 'Lucas', 'Sophia', 'Noah', 'Olivia']
    const students = []
    
    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i]
      let student = await Student.findOne({ 
        userId,
        name 
      })
      
      if (!student) {
        student = await Student.create({
          name,
          studentId: `STU-${name}-${Date.now()}`,
          gradeLevel: randomBetween(7, 11),
          userId,
          performance: {
            overallScore: randomBetween(70, 95),
            trend: randomItem(['improving', 'stable', 'declining']),
            subjectBreakdown: [],
            weeklyProgress: [],
            riskLevel: randomItem(['low', 'medium', 'high']),
            lastUpdated: new Date()
          },
          engagement: {
            currentEngagement: randomBetween(60, 90),
            predictedEngagement: randomBetween(65, 95),
            engagementTrend: randomItem(['increasing', 'stable', 'decreasing']),
            factors: [],
            sessionData: [],
            lastActive: new Date()
          }
        })
        console.log(`  ✅ Created student: ${name}`)
      } else {
        console.log(`  ✅ Student exists: ${name}`)
      }
      students.push(student)
    }
    console.log('')
    
    // Create teacher user for courses and messages
    let teacherUser = await User.findOne({ email: 'teacher@educonnect.com' })
    if (!teacherUser) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      teacherUser = await User.create({
        name: 'Dr. Sarah Johnson',
        email: 'teacher@educonnect.com',
        password: hashedPassword,
        role: 'teacher'
      })
    }
    const teacherId = String(teacherUser._id)
    
    // Create courses
    console.log('📝 Step 3: Creating courses...')
    const courseData = [
      { title: 'Mathematics 101', name: 'Mathematics', code: 'MATH101', subject: 'Math' },
      { title: 'Science 101', name: 'Science', code: 'SCI101', subject: 'Science' },
      { title: 'English 101', name: 'English', code: 'ENG101', subject: 'English' },
      { title: 'History 101', name: 'History', code: 'HIST101', subject: 'History' },
      { title: 'Computer Science 101', name: 'Computer Science', code: 'CS101', subject: 'CS' }
    ]
    const courses = []
    
    for (const data of courseData) {
      let course = await Course.findOne({ subject: data.subject })
      if (!course) {
        course = await Course.create({
          title: data.title,
          name: data.name,
          code: data.code,
          subject: data.subject,
          description: `${data.name} course description`,
          teacherId: teacherId,
          gradeLevel: 8
        })
        console.log(`  ✅ Created course: ${data.name}`)
      } else {
        console.log(`  ✅ Course exists: ${data.name}`)
      }
      if (course && course._id) {
        courses.push(course)
      }
    }
    console.log('')
    
    // Create enrollments
    console.log('📝 Step 4: Creating enrollments...')
    let enrollmentCount = 0
    for (const student of students) {
      for (const course of courses) {
        if (!course || !course._id) continue
        const courseId = String(course._id)
        const studentId = String(student._id)
        const studentUserId = String(student.userId)
        
        // Check using both studentId+courseId and userId+courseId (unique indexes)
        const existingByStudent = await Enrollment.findOne({
          studentId: studentId,
          courseId: courseId
        })
        
        const existingByUser = await Enrollment.findOne({
          userId: studentUserId,
          courseId: courseId
        })
        
        if (!existingByStudent && !existingByUser) {
          try {
            await Enrollment.create({
              userId: studentUserId,
              studentId: studentId,
              courseId: courseId,
              enrolledAt: daysFromNow(-30),
              status: 'active'
            })
            enrollmentCount++
            console.log(`  ✅ Enrolled student ${student.name} in ${course.subject}`)
          } catch (error: any) {
            // Skip if duplicate key error (enrollment already exists)
            if (error.code !== 11000) {
              console.log(`  ⚠️  Error creating enrollment: ${error.message}`)
            }
          }
        } else {
          console.log(`  ℹ️  Enrollment already exists for ${student.name} in ${course.subject}`)
        }
      }
    }
    console.log(`  ✅ Created ${enrollmentCount} enrollments\n`)
    
    // Create assignments
    console.log('📝 Step 5: Creating assignments...')
    const assignmentTypes = ['homework', 'quiz', 'project', 'exam']
    const assignments = []
    
    for (const course of courses) {
      for (const type of assignmentTypes) {
        const assignment = await Assignment.create({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${course.subject}`,
          description: `Complete this ${type} assignment for ${course.subject}`,
          type,
          courseId: String(course._id),
          subject: course.subject,
          dueDate: daysFromNow(randomBetween(1, 30)),
          maxScore: 100,
          status: randomItem(['active', 'completed', 'cancelled'])
        })
        assignments.push(assignment)
      }
    }
    console.log(`  ✅ Created ${assignments.length} assignments\n`)
    
    // Create grades
    console.log('📝 Step 6: Creating grades...')
    let gradeCount = 0
    
    // Create enrollments first if they don't exist
    const enrollmentsMap = new Map<string, any>()
    for (const student of students) {
      for (const course of courses) {
        if (!course || !course._id) continue
        const courseId = String(course._id)
        const studentId = String(student._id)
        const key = `${studentId}-${courseId}`
        
        let enrollment = await Enrollment.findOne({
          studentId: studentId,
          courseId: courseId
        })
        
        if (!enrollment) {
          try {
            enrollment = await Enrollment.create({
              userId: String(student.userId),
              studentId: studentId,
              courseId: courseId,
              enrolledAt: daysFromNow(-30),
              status: 'active'
            })
          } catch (error: any) {
            if (error.code !== 11000) {
              console.log(`  ⚠️  Error creating enrollment: ${error.message}`)
            }
            enrollment = await Enrollment.findOne({
              studentId: studentId,
              courseId: courseId
            })
          }
        }
        
        if (enrollment) {
          enrollmentsMap.set(key, enrollment)
        }
      }
    }
    
    // Now create grades
    for (const student of students) {
      for (const assignment of assignments) {
        // Only create grades for completed assignments
        if (assignment.status === 'completed') {
          const courseId = assignment.courseId
          const studentId = String(student._id)
          const key = `${studentId}-${courseId}`
          const enrollment = enrollmentsMap.get(key)
          
          if (enrollment) {
            // Check if grade already exists
            const existingGrade = await Grade.findOne({
              studentId: studentId,
              assignmentId: String(assignment._id)
            })
            
            if (!existingGrade) {
              const score = randomBetween(60, 100)
              const maxScore = (assignment as any).maxScore || 100
              const percentage = Math.round((score / maxScore) * 100)
              
              try {
                await Grade.create({
                  enrollmentId: String(enrollment._id),
                  studentId: studentId,
                  assignmentId: String(assignment._id),
                  courseId: courseId,
                  score,
                  maxScore,
                  percentage,
                  submittedAt: daysFromNow(-randomBetween(1, 30)),
                  gradedAt: daysFromNow(-randomBetween(1, 30))
                })
                gradeCount++
              } catch (error: any) {
                if (error.code !== 11000) {
                  console.log(`  ⚠️  Error creating grade: ${error.message}`)
                }
              }
            }
          }
        }
      }
    }
    console.log(`  ✅ Created ${gradeCount} grades\n`)
    
    // Create events
    console.log('📝 Step 7: Creating calendar events...')
    const eventTypes = ['school_event', 'exam', 'holiday', 'meeting', 'deadline', 'reminder']
    const eventTitles = [
      'School Assembly',
      'Math Exam',
      'Spring Break',
      'Parent-Teacher Meeting',
      'Project Deadline',
      'Reminder: Submit Assignment'
    ]
    
    let eventCount = 0
    for (let i = 0; i < 15; i++) {
      const type = randomItem(eventTypes)
      const title = eventTitles[i % eventTitles.length] + ` ${i + 1}`
      const startDate = daysFromNow(randomBetween(-30, 60))
      
      await Event.create({
        title,
        description: `Description for ${title}`,
        type,
        startDate,
        endDate: type === 'holiday' ? daysFromNow(randomBetween(1, 7)) : undefined,
        allDay: Math.random() > 0.5,
        studentId: String(randomItem(students)._id),
        createdBy: {
          userId,
          name: testUser.name,
          role: 'parent'
        },
        priority: randomItem(['low', 'normal', 'high']),
        reminders: Math.random() > 0.7 ? [{
          time: daysFromNow(-1),
          method: 'notification',
          sent: false
        }] : []
      })
      eventCount++
    }
    console.log(`  ✅ Created ${eventCount} events\n`)
    
    // Create messages
    console.log('📝 Step 8: Creating messages...')
    const messageSubjects = [
      'Progress Update',
      'Assignment Reminder',
      'Parent-Teacher Conference',
      'Grade Notification',
      'School Announcement'
    ]
    
    // Use existing teacher user (created in Step 3)
    let messageCount = 0
    for (let i = 0; i < 10; i++) {
      const subject = messageSubjects[i % messageSubjects.length] + ` ${i + 1}`
      
      await Message.create({
        from: {
          userId: String(teacherUser._id),
          name: teacherUser.name,
          role: 'teacher'
        },
        to: {
          userId,
          name: testUser.name,
          role: 'parent'
        },
        subject,
        content: `This is the message content for ${subject}. Please review and respond if needed.`,
        studentId: String(randomItem(students)._id),
        read: Math.random() > 0.5,
        priority: randomItem(['low', 'normal', 'high']),
        category: randomItem(['general', 'academic', 'attendance', 'behavior', 'assignment'])
      })
      messageCount++
    }
    console.log(`  ✅ Created ${messageCount} messages\n`)
    
    // Create notices
    console.log('📝 Step 9: Creating notices...')
    const noticeTitles = [
      'School Holiday Announcement',
      'New Policy Update',
      'Upcoming Event',
      'Important Reminder',
      'General Information'
    ]
    
    let noticeCount = 0
    for (let i = 0; i < 8; i++) {
      const title = noticeTitles[i % noticeTitles.length] + ` ${i + 1}`
      
      await Notice.create({
        title,
        content: `This is the notice content for ${title}. Please read carefully.`,
        type: randomItem(['announcement', 'event', 'alert', 'info', 'reminder']),
        priority: randomItem(['low', 'normal', 'high']),
        published: true,
        publishedAt: daysFromNow(-randomBetween(0, 30)),
        createdBy: {
          userId: String(teacherUser._id),
          name: teacherUser.name,
          role: 'teacher'
        }
      })
      noticeCount++
    }
    console.log(`  ✅ Created ${noticeCount} notices\n`)
    
    // Create goals
    console.log('📝 Step 10: Creating goals...')
    let goalCount = 0
    for (const student of students.slice(0, 3)) { // Create goals for first 3 students
      const course = randomItem(courses)
      await Goal.create({
        studentId: String(student._id),
        name: `Improve ${course.subject} Grade`,
        type: 'grade',
        subject: course.subject,
        target: randomBetween(80, 95),
        current: randomBetween(60, 75),
        unit: '%',
        deadline: daysFromNow(randomBetween(30, 90)),
        status: 'active',
        description: `Work towards improving performance in ${course.subject}`,
        startDate: daysFromNow(-7),
        progressPercentage: Math.round((randomBetween(60, 75) / randomBetween(80, 95)) * 100),
        onTrack: Math.random() > 0.3
      })
      goalCount++
    }
    console.log(`  ✅ Created ${goalCount} goals\n`)
    
    // Create alerts
    console.log('📝 Step 11: Creating alerts...')
    let alertCount = 0
    for (const student of students) {
      if (Math.random() > 0.5) {
        await Alert.create({
          studentId: String(student._id),
          type: randomItem(['performance', 'engagement', 'attendance', 'deadline', 'achievement']),
          priority: randomItem(['low', 'medium', 'high', 'critical']),
          title: `Alert for ${student.name}`,
          message: `This is an alert message for ${student.name}`,
          actionRequired: Math.random() > 0.7,
          metadata: {}
        })
        alertCount++
      }
    }
    console.log(`  ✅ Created ${alertCount} alerts\n`)
    
    // Create timetable/schedule for first student (Emma)
    console.log('📝 Step 12: Creating timetable for first student...')
    const firstStudent = students[0] // Emma
    if (firstStudent && courses.length > 0) {
      // Get course IDs - use available courses
      const mathCourse = courses.find(c => c.subject === 'Math')
      const scienceCourse = courses.find(c => c.subject === 'Science')
      const englishCourse = courses.find(c => c.subject === 'English')
      const historyCourse = courses.find(c => c.subject === 'History')
      const csCourse = courses.find(c => c.subject === 'CS')
      
      // Use first available courses if specific ones don't exist
      const availableCourses = courses.filter(c => c && c._id)
      const course1 = mathCourse || englishCourse || availableCourses[0]
      const course2 = scienceCourse || historyCourse || availableCourses[1] || availableCourses[0]
      const course3 = englishCourse || csCourse || availableCourses[2] || availableCourses[0]
      const course4 = historyCourse || availableCourses[3] || availableCourses[0]
      const course5 = csCourse || availableCourses[4] || availableCourses[0]
      
      if (firstStudent && availableCourses.length > 0 && course1) {
        const scheduleData = [
          // Monday
          { dayOfWeek: 1, period: 1, startTime: '08:00', endTime: '09:00', course: course1, room: 'Room 101', teacher: 'Mr. Smith' },
          { dayOfWeek: 1, period: 2, startTime: '09:15', endTime: '10:15', course: course2 || course1, room: 'Lab A', teacher: 'Ms. Jones' },
          { dayOfWeek: 1, period: 3, startTime: '10:30', endTime: '11:30', course: course3 || course1, room: 'Room 205', teacher: 'Mrs. Brown' },
          { dayOfWeek: 1, period: 4, startTime: '13:00', endTime: '14:00', course: course4 || course1, room: 'Room 302', teacher: 'Dr. Lee' },
          
          // Tuesday
          { dayOfWeek: 2, period: 1, startTime: '08:00', endTime: '09:00', course: course4 || course1, room: 'Room 302', teacher: 'Dr. Lee' },
          { dayOfWeek: 2, period: 2, startTime: '09:15', endTime: '10:15', course: course1, room: 'Room 101', teacher: 'Mr. Smith' },
          { dayOfWeek: 2, period: 3, startTime: '10:30', endTime: '11:30', course: course5 || course1, room: 'Lab B', teacher: 'Mr. Chen' },
          { dayOfWeek: 2, period: 4, startTime: '13:00', endTime: '14:00', course: course2 || course1, room: 'Lab A', teacher: 'Ms. Jones' },
          
          // Wednesday
          { dayOfWeek: 3, period: 1, startTime: '08:00', endTime: '09:00', course: course2 || course1, room: 'Lab A', teacher: 'Ms. Jones' },
          { dayOfWeek: 3, period: 2, startTime: '09:15', endTime: '10:15', course: course3 || course1, room: 'Room 205', teacher: 'Mrs. Brown' },
          { dayOfWeek: 3, period: 3, startTime: '10:30', endTime: '11:30', course: course1, room: 'Room 101', teacher: 'Mr. Smith' },
          { dayOfWeek: 3, period: 4, startTime: '13:00', endTime: '14:00', course: course5 || course1, room: 'Lab B', teacher: 'Mr. Chen' },
          
          // Thursday
          { dayOfWeek: 4, period: 1, startTime: '08:00', endTime: '09:00', course: course5 || course1, room: 'Lab B', teacher: 'Mr. Chen' },
          { dayOfWeek: 4, period: 2, startTime: '09:15', endTime: '10:15', course: course4 || course1, room: 'Room 302', teacher: 'Dr. Lee' },
          { dayOfWeek: 4, period: 3, startTime: '10:30', endTime: '11:30', course: course2 || course1, room: 'Lab A', teacher: 'Ms. Jones' },
          { dayOfWeek: 4, period: 4, startTime: '13:00', endTime: '14:00', course: course3 || course1, room: 'Room 205', teacher: 'Mrs. Brown' },
          
          // Friday
          { dayOfWeek: 5, period: 1, startTime: '08:00', endTime: '09:00', course: course3 || course1, room: 'Room 205', teacher: 'Mrs. Brown' },
          { dayOfWeek: 5, period: 2, startTime: '09:15', endTime: '10:15', course: course1, room: 'Room 101', teacher: 'Mr. Smith' },
          { dayOfWeek: 5, period: 3, startTime: '10:30', endTime: '11:30', course: course4 || course1, room: 'Room 302', teacher: 'Dr. Lee' },
          { dayOfWeek: 5, period: 4, startTime: '13:00', endTime: '14:00', course: course5 || course1, room: 'Lab B', teacher: 'Mr. Chen' }
        ]
        
        let scheduleCount = 0
        for (const entry of scheduleData) {
          // Check if schedule already exists
          const existing = await Schedule.findOne({
            studentId: String(firstStudent._id),
            dayOfWeek: entry.dayOfWeek,
            period: entry.period
          })
          
          if (!existing) {
            try {
              await Schedule.create({
                studentId: String(firstStudent._id),
                courseId: String(entry.course._id),
                dayOfWeek: entry.dayOfWeek,
                period: entry.period,
                startTime: entry.startTime,
                endTime: entry.endTime,
                room: entry.room,
                teacherName: entry.teacher,
                active: true
              })
              scheduleCount++
            } catch (error: any) {
              if (error.code !== 11000) {
                console.log(`  ⚠️  Error creating schedule: ${error.message}`)
              }
            }
          }
        }
        console.log(`  ✅ Created ${scheduleCount} schedule entries for ${firstStudent.name}`)
        if (scheduleCount === 0) {
          console.log(`  ℹ️  Schedule entries may already exist for ${firstStudent.name}`)
        }
        console.log('')
      } else {
        console.log(`  ⚠️  No courses available to create schedule for ${firstStudent.name}\n`)
      }
    } else {
      console.log(`  ⚠️  First student not found or no courses available\n`)
    }
    
    // Create fees for students
    console.log('📝 Step 13: Creating fees and payments...')
    const feeTypes = ['tuition', 'activity', 'transport', 'library', 'technology', 'other']
    const paymentMethods = ['cash', 'check', 'bank_transfer', 'online', 'card']
    let feeCount = 0

    for (const student of students.slice(0, 3)) { // Create fees for first 3 students
      const studentId = String(student._id)
      
      // Create various fees
      const feesData = [
        // Tuition fees (recurring)
        {
          feeType: 'tuition' as const,
          description: `Tuition Fee - ${new Date().getFullYear()} Semester 1`,
          amount: 2500,
          dueDate: daysFromNow(-30), // Overdue
          status: 'overdue' as const,
          paidAmount: 0,
        },
        {
          feeType: 'tuition' as const,
          description: `Tuition Fee - ${new Date().getFullYear()} Semester 2`,
          amount: 2500,
          dueDate: daysFromNow(30),
          status: 'pending' as const,
          paidAmount: 0,
        },
        {
          feeType: 'tuition' as const,
          description: `Tuition Fee - ${new Date().getFullYear() - 1} Semester 2`,
          amount: 2400,
          dueDate: daysFromNow(-180),
          status: 'paid' as const,
          paidAmount: 2400,
          paidDate: daysFromNow(-170),
          paymentMethod: 'bank_transfer' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        
        // Activity fees
        {
          feeType: 'activity' as const,
          description: 'Sports Activity Fee',
          amount: 150,
          dueDate: daysFromNow(-15),
          status: 'paid' as const,
          paidAmount: 150,
          paidDate: daysFromNow(-10),
          paymentMethod: 'online' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        {
          feeType: 'activity' as const,
          description: 'Annual School Trip',
          amount: 300,
          dueDate: daysFromNow(60),
          status: 'pending' as const,
          paidAmount: 0,
        },
        
        // Transport fees
        {
          feeType: 'transport' as const,
          description: 'Monthly Bus Fee - January',
          amount: 120,
          dueDate: daysFromNow(-60),
          status: 'paid' as const,
          paidAmount: 120,
          paidDate: daysFromNow(-55),
          paymentMethod: 'cash' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        {
          feeType: 'transport' as const,
          description: 'Monthly Bus Fee - February',
          amount: 120,
          dueDate: daysFromNow(-30),
          status: 'paid' as const,
          paidAmount: 120,
          paidDate: daysFromNow(-25),
          paymentMethod: 'cash' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        {
          feeType: 'transport' as const,
          description: 'Monthly Bus Fee - March',
          amount: 120,
          dueDate: daysFromNow(0),
          status: 'partial' as const,
          paidAmount: 60,
          paidDate: daysFromNow(-5),
          paymentMethod: 'card' as const,
          notes: 'Partial payment - remaining balance due',
        },
        {
          feeType: 'transport' as const,
          description: 'Monthly Bus Fee - April',
          amount: 120,
          dueDate: daysFromNow(30),
          status: 'pending' as const,
          paidAmount: 0,
        },
        
        // Library fees
        {
          feeType: 'library' as const,
          description: 'Library Membership Fee',
          amount: 50,
          dueDate: daysFromNow(-90),
          status: 'paid' as const,
          paidAmount: 50,
          paidDate: daysFromNow(-85),
          paymentMethod: 'online' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        {
          feeType: 'library' as const,
          description: 'Late Book Return Fine',
          amount: 25,
          dueDate: daysFromNow(-5),
          status: 'pending' as const,
          paidAmount: 0,
        },
        
        // Technology fees
        {
          feeType: 'technology' as const,
          description: 'Laptop/Device Rental Fee - Annual',
          amount: 200,
          dueDate: daysFromNow(-120),
          status: 'paid' as const,
          paidAmount: 200,
          paidDate: daysFromNow(-115),
          paymentMethod: 'bank_transfer' as const,
          receiptNumber: `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
        {
          feeType: 'technology' as const,
          description: 'Software License Fee',
          amount: 75,
          dueDate: daysFromNow(45),
          status: 'pending' as const,
          paidAmount: 0,
        },
        
        // Other fees
        {
          feeType: 'other' as const,
          description: 'Graduation Ceremony Fee',
          amount: 100,
          dueDate: daysFromNow(90),
          status: 'pending' as const,
          paidAmount: 0,
        }
      ]

      for (const feeData of feesData) {
        try {
          await Fee.create({
            studentId,
            ...feeData
          })
          feeCount++
        } catch (error: any) {
          if (error.code !== 11000) {
            console.log(`  ⚠️  Error creating fee: ${error.message}`)
          }
        }
      }
    }
    console.log(`  ✅ Created ${feeCount} fee records\n`)
    
    // Summary
    console.log('═══════════════════════════════════════')
    console.log('✅ Test Data Seeding Complete!')
    console.log('═══════════════════════════════════════')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   • Students: ${students.length}`)
    console.log(`   • Courses: ${courses.length}`)
    console.log(`   • Enrollments: ${enrollmentCount}`)
    console.log(`   • Assignments: ${assignments.length}`)
    console.log(`   • Grades: ${gradeCount}`)
    console.log(`   • Events: ${eventCount}`)
    console.log(`   • Messages: ${messageCount}`)
    console.log(`   • Notices: ${noticeCount}`)
    console.log(`   • Goals: ${goalCount}`)
    console.log(`   • Alerts: ${alertCount}`)
    const scheduleCount = firstStudent ? await Schedule.countDocuments({ studentId: String(firstStudent._id) }) : 0
    if (scheduleCount > 0) {
      console.log(`   • Schedule entries: ${scheduleCount} (for ${firstStudent?.name || 'first student'})`)
    }
    const totalFeesCount = await Fee.countDocuments()
    if (totalFeesCount > 0) {
      console.log(`   • Fees: ${totalFeesCount}`)
    }
    console.log('')
    console.log('🎉 Your dashboard should now have data in all components!')
    console.log('')
    console.log('📝 Login Credentials:')
    console.log('   Email: test@educonnect.com')
    console.log('   Password: password123')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  } finally {
    await disconnectDB()
  }
}

// Run seed script
if (require.main === module) {
  seedCompleteTestData()
    .then(() => {
      console.log('🎉 Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Seed script failed:', error)
      process.exit(1)
    })
}

export default seedCompleteTestData

