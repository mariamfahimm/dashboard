// Notice Model - For school announcements and notices
import mongoose, { Schema, Document } from 'mongoose'

export interface INotice extends Document {
  title: string
  content: string
  type: 'announcement' | 'event' | 'alert' | 'info' | 'reminder'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  targetAudience: 'all' | 'parents' | 'students' | 'teachers' | string[] // Can be specific user IDs
  studentId?: string // Optional: link to specific student
  startDate?: Date
  endDate?: Date
  published: boolean
  publishedAt?: Date
  attachments?: string[] // Array of file URLs
  createdBy: {
    userId: string
    name: string
    role: 'admin' | 'teacher'
  }
  createdAt: Date
  updatedAt: Date
}

const NoticeSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['announcement', 'event', 'alert', 'info', 'reminder'],
      default: 'info'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    targetAudience: {
      type: Schema.Types.Mixed, // Can be string or array
      default: 'all'
    },
    studentId: {
      type: String,
      index: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    published: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      type: String
    }],
    createdBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['admin', 'teacher'], required: true }
    }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient queries
NoticeSchema.index({ published: 1, publishedAt: -1 })
NoticeSchema.index({ targetAudience: 1 })
NoticeSchema.index({ studentId: 1 })
NoticeSchema.index({ type: 1, priority: 1 })
NoticeSchema.index({ startDate: 1, endDate: 1 })

export default mongoose.model<INotice>('Notice', NoticeSchema)

