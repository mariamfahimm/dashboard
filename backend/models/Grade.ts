// Grade Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IGrade extends Document {
  enrollmentId: string
  assignmentId: string
  studentId: string
  courseId: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: Date
  gradedAt?: Date
  createdAt: Date
}

const GradeSchema: Schema = new Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      ref: 'Enrollment'
    },
    assignmentId: {
      type: String,
      required: true,
      ref: 'Assignment'
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
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    submittedAt: {
      type: Date,
      required: true
    },
    gradedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

// Indexes
GradeSchema.index({ enrollmentId: 1, assignmentId: 1 }, { unique: true })
GradeSchema.index({ studentId: 1 })
GradeSchema.index({ courseId: 1 })
GradeSchema.index({ assignmentId: 1 })

export default mongoose.model<IGrade>('Grade', GradeSchema)

