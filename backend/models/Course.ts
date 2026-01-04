// Course Model
import mongoose, { Schema, Document } from 'mongoose'

export interface ICourse extends Document {
  title: string
  description: string
  teacherId: string
  subject: string
  createdAt: Date
  updatedAt: Date
}

const CourseSchema: Schema = new Schema(
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
    teacherId: {
      type: String,
      required: true,
      ref: 'User'
    },
    subject: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
CourseSchema.index({ teacherId: 1 })
CourseSchema.index({ subject: 1 })

export default mongoose.model<ICourse>('Course', CourseSchema)

