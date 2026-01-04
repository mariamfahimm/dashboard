// Recommendation Model
import mongoose, { Schema, Document } from 'mongoose'

export type RecommendationCategory = 
  | 'study_plan' 
  | 'resource' 
  | 'activity' 
  | 'goal' 
  | 'intervention'

export interface IRecommendation extends Document {
  category: RecommendationCategory
  title: string
  description: string
  priority: number
  confidence: number
  studentId: string
  reasoning: string
  actionUrl?: string
  metadata?: Record<string, any>
  accepted: boolean
  dismissed: boolean
  createdAt: Date
}

const RecommendationSchema: Schema = new Schema(
  {
    category: {
      type: String,
      enum: ['study_plan', 'resource', 'activity', 'goal', 'intervention'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    studentId: {
      type: String,
      required: true,
      ref: 'Student'
    },
    reasoning: {
      type: String,
      required: true
    },
    actionUrl: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    accepted: {
      type: Boolean,
      default: false
    },
    dismissed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

// Indexes
RecommendationSchema.index({ studentId: 1, createdAt: -1 })
RecommendationSchema.index({ accepted: 1, dismissed: 1 })
RecommendationSchema.index({ priority: -1 })

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema)

