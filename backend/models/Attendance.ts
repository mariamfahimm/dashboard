// Attendance Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IAttendance extends Document {
  studentId: string
  date: Date
  status: 'present' | 'absent' | 'late' | 'excused'
  time?: string
  notes?: string
  markedBy?: string // User ID who marked the attendance
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    },
    time: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    markedBy: {
      type: String,
      ref: 'User',
      trim: true
    }
  },
  {
    timestamps: true
  }
)

// Compound index to ensure one attendance record per student per date
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true })

// Index for date range queries
AttendanceSchema.index({ date: -1 })

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema)

