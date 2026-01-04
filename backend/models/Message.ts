// Message Model - For communication between parents and teachers
import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  from: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
    avatar?: string
  }
  to: {
    userId: string
    name: string
    role: 'parent' | 'teacher' | 'admin'
  }
  studentId?: string // Optional: link message to a specific student
  subject: string
  content: string
  read: boolean
  readAt?: Date
  priority: 'low' | 'normal' | 'high'
  category: 'general' | 'academic' | 'attendance' | 'behavior' | 'assignment'
  attachments?: string[] // Array of file URLs
  createdAt: Date
  updatedAt: Date
}

const MessageSchema: Schema = new Schema(
  {
    from: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
      avatar: { type: String }
    },
    to: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true }
    },
    studentId: {
      type: String,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'attendance', 'behavior', 'assignment'],
      default: 'general'
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
MessageSchema.index({ 'to.userId': 1, read: 1 })
MessageSchema.index({ 'from.userId': 1 })
MessageSchema.index({ studentId: 1 })
MessageSchema.index({ createdAt: -1 })

export default mongoose.model<IMessage>('Message', MessageSchema)

