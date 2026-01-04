// Alert Model
import mongoose, { Schema, Document } from 'mongoose'

export type AlertType = 'performance' | 'engagement' | 'attendance' | 'deadline' | 'achievement'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

export interface IAlert extends Document {
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  studentId: string
  timestamp: Date
  read: boolean
  actionRequired: boolean
  metadata?: Record<string, any>
  createdAt: Date
}

const AlertSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['performance', 'engagement', 'attendance', 'deadline', 'achievement'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true,
      ref: 'Student'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    },
    actionRequired: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
)

// Indexes
AlertSchema.index({ studentId: 1, timestamp: -1 })
AlertSchema.index({ read: 1 })
AlertSchema.index({ priority: 1 })

export default mongoose.model<IAlert>('Alert', AlertSchema)

