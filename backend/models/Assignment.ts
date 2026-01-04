// Assignment Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IAssignment extends Document {
  courseId: string
  title: string
  description: string
  subject: string
  dueDate: Date
  status: 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const AssignmentSchema: Schema = new Schema(
  {
    courseId: {
      type: String,
      required: true,
      ref: 'Course'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    subject: {
      type: String,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
)

// Indexes
AssignmentSchema.index({ courseId: 1 })
AssignmentSchema.index({ dueDate: 1 })
AssignmentSchema.index({ subject: 1 })

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema)

