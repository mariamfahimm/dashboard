// Attendance Controller
import { Request, Response } from 'express'
import Attendance from '../models/Attendance'
import { AppError, asyncHandler } from '../utils/errors'

// GET /api/attendance/:studentId - Get attendance records for a student
export const getAttendanceByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { startDate, endDate, status } = req.query

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const filter: any = { studentId }

  // Add date range filter
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) {
      filter.date.$gte = new Date(startDate as string)
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate as string)
    }
  }

  // Add status filter
  if (status) {
    filter.status = status
  }

  const attendance = await Attendance.find(filter)
    .sort({ date: -1 })
    .limit(365) // Limit to last year of records

  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  })
})

// GET /api/attendance/:studentId/stats - Get attendance statistics for a student
export const getAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params
  const { startDate, endDate } = req.query

  if (!studentId) {
    throw new AppError('Student ID is required', 400)
  }

  const filter: any = { studentId }

  // Add date range filter
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) {
      filter.date.$gte = new Date(startDate as string)
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate as string)
    }
  }

  const attendance = await Attendance.find(filter)

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    attendanceRate: attendance.length > 0
      ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'excused').length / attendance.length) * 100)
      : 0
  }

  res.json({
    success: true,
    data: stats
  })
})

// POST /api/attendance - Create or update attendance record
export const createOrUpdateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, date, status, time, notes } = req.body
  const userId = (req as any).user?._id || (req as any).user?.id

  if (!studentId || !date || !status) {
    throw new AppError('Student ID, date, and status are required', 400)
  }

  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    throw new AppError('Invalid attendance status', 400)
  }

  const attendanceDate = new Date(date)
  const startOfDay = new Date(attendanceDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(attendanceDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  // Check if attendance for this date already exists
  const existing = await Attendance.findOne({
    studentId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  })

  if (existing) {
    // Update existing record
    existing.status = status
    if (time) existing.time = time
    if (notes) existing.notes = notes
    if (userId) existing.markedBy = userId
    await existing.save()

    res.json({
      success: true,
      data: existing,
      message: 'Attendance record updated'
    })
  } else {
    // Create new record (use start of day for consistent date storage)
    const attendance = await Attendance.create({
      studentId,
      date: startOfDay,
      status,
      time,
      notes,
      markedBy: userId
    })

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance record created'
    })
  }
})

// GET /api/attendance - Get all attendance records (with filters)
export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, startDate, endDate, status, limit = 100 } = req.query

  const filter: any = {}

  if (studentId) filter.studentId = studentId
  if (status) filter.status = status

  if (startDate || endDate) {
    filter.date = {}
    if (startDate) {
      filter.date.$gte = new Date(startDate as string)
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate as string)
    }
  }

  const attendance = await Attendance.find(filter)
    .sort({ date: -1 })
    .limit(Number(limit))

  res.json({
    success: true,
    count: attendance.length,
    data: attendance
  })
})

