// Student Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IStudent extends Document {
  name: string
  gradeLevel: number
  studentId: string
  userId?: string
  avatar?: string
  linkingCode?: string
  linkingCodeExpiry?: Date
  performance: {
    overallScore: number
    trend: 'improving' | 'stable' | 'declining'
    subjectBreakdown: {
      subject: string
      score: number
      change: number
    }[]
    weeklyProgress: {
      week: string
      score: number
    }[]
    riskLevel: 'low' | 'medium' | 'high'
    lastUpdated: Date
  }
  engagement: {
    currentEngagement: number
    predictedEngagement: number
    engagementTrend: 'increasing' | 'stable' | 'decreasing'
    factors: {
      factor: string
      impact: number
      weight: number
    }[]
    sessionData: {
      date: Date
      duration: number
      activities: number
      completionRate: number
    }[]
    lastActive: Date
  }
  createdAt: Date
  updatedAt: Date
}

const StudentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameArabic: {
      type: String,
      trim: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    gradeLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    userId: {
      type: String,
      trim: true,
      index: true
    },
    avatar: {
      type: String,
      trim: true
    },
    linkingCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    linkingCodeExpiry: {
      type: Date
    },
    performance: {
      overallScore: { type: Number, default: 0, min: 0, max: 100 },
      trend: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
        default: 'stable'
      },
      subjectBreakdown: [{
        subject: String,
        score: Number,
        change: Number
      }],
      weeklyProgress: [{
        week: String,
        score: Number
      }],
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      },
      lastUpdated: { type: Date, default: Date.now }
    },
    engagement: {
      currentEngagement: { type: Number, default: 0, min: 0, max: 100 },
      predictedEngagement: { type: Number, default: 0, min: 0, max: 100 },
      engagementTrend: {
        type: String,
        enum: ['increasing', 'stable', 'decreasing'],
        default: 'stable'
      },
      factors: [{
        factor: String,
        impact: Number,
        weight: Number
      }],
      sessionData: [{
        date: Date,
        duration: Number,
        activities: Number,
        completionRate: Number
      }],
      lastActive: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true
  }
)

// Index for faster queries
StudentSchema.index({ studentId: 1 })
StudentSchema.index({ 'performance.lastUpdated': -1 })

export default mongoose.model<IStudent>('Student', StudentSchema)

