// Event Model - For academic calendar events
import mongoose, { Schema, Document } from 'mongoose'

export interface IEvent extends Document {
  title: string
  description?: string
  type: 'assignment' | 'exam' | 'holiday' | 'school_event' | 'meeting' | 'deadline' | 'reminder'
  startDate: Date
  endDate?: Date
  allDay: boolean
  location?: string
  studentId?: string // Optional: link to specific student
  courseId?: string // Optional: link to specific course
  createdBy: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
  }
  reminders?: Array<{
    time: Date
    method: 'notification' | 'email' | 'sms'
    sent: boolean
  }>
  color?: string // For calendar display
  priority: 'low' | 'normal' | 'high'
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    count?: number
  }
  attachments?: string[] // Array of file URLs
  createdAt: Date
  updatedAt: Date
}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['assignment', 'exam', 'holiday', 'school_event', 'meeting', 'deadline', 'reminder'],
      required: true,
      default: 'school_event'
    },
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      index: true
    },
    allDay: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      trim: true
    },
    studentId: {
      type: String,
      index: true
    },
    courseId: {
      type: String,
      index: true
    },
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { 
        type: String, 
        enum: ['parent', 'teacher', 'admin'],
        required: true 
      }
    },
    reminders: [{
      time: { type: Date, required: true },
      method: { 
        type: String, 
        enum: ['notification', 'email', 'sms'],
        default: 'notification'
      },
      sent: { type: Boolean, default: false }
    }],
    color: {
      type: String,
      default: '#3b82f6' // Default brand blue
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    recurring: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
      },
      interval: { type: Number, default: 1 },
      endDate: Date,
      count: Number
    },
    attachments: [{
      type: String
    }]
  },
  {
    timestamps: true
  }
)

// Indexes for efficient queries
EventSchema.index({ startDate: 1, endDate: 1 })
EventSchema.index({ studentId: 1, startDate: 1 })
EventSchema.index({ type: 1, startDate: 1 })
EventSchema.index({ 'createdBy.userId': 1 })

export default mongoose.model<IEvent>('Event', EventSchema)

