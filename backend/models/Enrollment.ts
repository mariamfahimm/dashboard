// Enrollment Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IEnrollment extends Document {
  userId: string
  studentId: string
  courseId: string
  enrolledAt: Date
  status: 'active' | 'completed' | 'dropped'
  createdAt: Date
}

const EnrollmentSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    studentId: {
      type: String,
      required: true,
      ref: 'Student'
    },
    courseId: {
      type: String,
      required: true,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
)

// Indexes
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true })
EnrollmentSchema.index({ studentId: 1 })
EnrollmentSchema.index({ courseId: 1 })

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema)

