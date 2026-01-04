// Schedule/Timetable Model
import mongoose, { Schema, Document } from 'mongoose'

export interface ISchedule extends Document {
  studentId: string
  courseId: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  period: number // Period number (1, 2, 3, etc.)
  startTime: string // Format: "HH:MM" (e.g., "08:00")
  endTime: string // Format: "HH:MM" (e.g., "09:00")
  room?: string
  teacherId?: string
  teacherName?: string
  active: boolean // For schedule changes/updates
  effectiveFrom?: Date // When this schedule becomes active
  effectiveUntil?: Date // When this schedule expires
  createdAt: Date
  updatedAt: Date
}

const ScheduleSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true
    },
    courseId: {
      type: String,
      required: true,
      ref: 'Course',
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    },
    period: {
      type: Number,
      required: true,
      min: 1
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    room: {
      type: String,
      trim: true
    },
    teacherId: {
      type: String,
      ref: 'User',
      trim: true
    },
    teacherName: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    effectiveFrom: {
      type: Date
    },
    effectiveUntil: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

// Compound index to ensure one schedule entry per student/course/day/period
ScheduleSchema.index({ studentId: 1, dayOfWeek: 1, period: 1 }, { unique: true })

// Index for date range queries
ScheduleSchema.index({ studentId: 1, dayOfWeek: 1 })

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema)

