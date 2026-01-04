// Goal Model
import mongoose, { Schema, Document } from 'mongoose'

export type GoalType = 'grade' | 'time' | 'completion'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export interface IGoal extends Document {
  studentId: string
  name: string
  description?: string
  type: GoalType
  subject?: string // Required for 'grade' type
  target: number
  current: number
  unit: string // e.g., '%', 'hrs', 'days'
  status: GoalStatus
  startDate: Date
  targetDate?: Date
  estimatedCompletionDate?: Date // From predictiveForecast
  percentChance?: number // 0-100, from predictiveForecast
  progressPercentage: number // Calculated: (current / target) * 100
  onTrack: boolean // From predictiveForecast
  confidence?: number // 0-1, from predictiveForecast
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const GoalSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true
    },
    name: {
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
      enum: ['grade', 'time', 'completion'],
      required: true
    },
    subject: {
      type: String,
      required: function(this: IGoal) {
        return this.type === 'grade'
      }
    },
    target: {
      type: Number,
      required: true,
      min: 0
    },
    current: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      default: '%'
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    targetDate: {
      type: Date
    },
    estimatedCompletionDate: {
      type: Date
    },
    percentChance: {
      type: Number,
      min: 0,
      max: 100
    },
    progressPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100
    },
    onTrack: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
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
GoalSchema.index({ studentId: 1, status: 1 })
GoalSchema.index({ studentId: 1, type: 1 })
GoalSchema.index({ targetDate: 1 })

// Calculate progress percentage before saving
GoalSchema.pre('save', function(this: IGoal, next) {
  if (this.target > 0) {
    this.progressPercentage = Math.min(100, Math.round((this.current / this.target) * 100))
  }
  next()
})

export default mongoose.model<IGoal>('Goal', GoalSchema)

