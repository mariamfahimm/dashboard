// Schedule/Timetable Controller
import { Request, Response } from 'express'
import Schedule from '../models/Schedule'
import Course from '../models/Course'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/schedule/:studentId - Get timetable for a student
export const getScheduleByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { dayOfWeek } = req.query

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const filter: any = {
    studentId,
    active: true
  }

  // Filter by day if provided
  if (dayOfWeek !== undefined) {
    filter.dayOfWeek = parseInt(dayOfWeek as string)
  }

  // Check for effective dates - only show schedules that are currently active
  const now = new Date()
  filter.$and = [
    {
      $or: [
        { effectiveFrom: { $exists: false } },
        { effectiveFrom: { $lte: now } }
      ]
    },
    {
      $or: [
        { effectiveUntil: { $exists: false } },
        { effectiveUntil: { $gte: now } }
      ]
    }
  ]

  const schedules = await Schedule.find(filter)
    .sort({ dayOfWeek: 1, period: 1 })

  // Populate course information
  const schedulesWithCourses = await Promise.all(
    schedules.map(async (schedule) => {
      const course = await Course.findById(schedule.courseId)
      return {
        ...schedule.toObject(),
        course: course ? {
          _id: course._id,
          title: course.title,
          subject: course.subject,
          description: course.description
        } : null
      }
    })
  )

  res.json({
    success: true,
    count: schedulesWithCourses.length,
    data: schedulesWithCourses
  })
})

// GET /api/schedule/:studentId/weekly - Get weekly timetable organized by day
export const getWeeklySchedule = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const now = new Date()
  const filter: any = {
    studentId,
    active: true,
    $and: [
      {
        $or: [
          { effectiveFrom: { $exists: false } },
          { effectiveFrom: { $lte: now } }
        ]
      },
      {
        $or: [
          { effectiveUntil: { $exists: false } },
          { effectiveUntil: { $gte: now } }
        ]
      }
    ]
  }

  const schedules = await Schedule.find(filter)
    .sort({ dayOfWeek: 1, period: 1 })

  // Organize by day of week
  const weeklySchedule: Record<number, any[]> = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: []  // Saturday
  }

  // Populate course information and organize by day
  for (const schedule of schedules) {
    const course = await Course.findById(schedule.courseId)
    const scheduleData = {
      ...schedule.toObject(),
      course: course ? {
        _id: course._id,
        title: course.title,
        subject: course.subject,
        description: course.description
      } : null
    }
    weeklySchedule[schedule.dayOfWeek].push(scheduleData)
  }

  // Sort each day by period
  Object.keys(weeklySchedule).forEach(day => {
    weeklySchedule[parseInt(day)].sort((a, b) => a.period - b.period)
  })

  res.json({
    success: true,
    data: weeklySchedule
  })
})

// POST /api/schedule - Create or update schedule entry
export const createOrUpdateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, courseId, dayOfWeek, period, startTime, endTime, room, teacherId, teacherName, effectiveFrom, effectiveUntil } = req.body

  if (!studentId || !courseId || dayOfWeek === undefined || !period || !startTime || !endTime) {
    throw new AppError('Student ID, course ID, day of week, period, start time, and end time are required', 400)
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError('Day of week must be between 0 (Sunday) and 6 (Saturday)', 400)
  }

  // Check if schedule entry already exists
  const existing = await Schedule.findOne({
    studentId,
    dayOfWeek,
    period
  })

  if (existing) {
    // Update existing
    existing.courseId = courseId
    existing.startTime = startTime
    existing.endTime = endTime
    if (room !== undefined) existing.room = room
    if (teacherId !== undefined) existing.teacherId = teacherId
    if (teacherName !== undefined) existing.teacherName = teacherName
    if (effectiveFrom !== undefined) existing.effectiveFrom = effectiveFrom ? new Date(effectiveFrom) : undefined
    if (effectiveUntil !== undefined) existing.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : undefined
    await existing.save()

    res.json({
      success: true,
      data: existing,
      message: 'Schedule updated successfully'
    })
  } else {
    // Create new
    const schedule = await Schedule.create({
      studentId,
      courseId,
      dayOfWeek,
      period,
      startTime,
      endTime,
      room,
      teacherId,
      teacherName,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : undefined
    })

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    })
  }
})

// DELETE /api/schedule/:id - Delete schedule entry
export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await Schedule.findByIdAndDelete(req.params.id)

  if (!schedule) {
    throw new AppError('Schedule not found', 404)
  }

  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  })
})

