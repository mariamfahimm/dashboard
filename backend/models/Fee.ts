// Fee/Payment Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IFee extends Document {
  studentId: string
  feeType: 'tuition' | 'activity' | 'transport' | 'library' | 'technology' | 'other'
  description: string
  amount: number
  dueDate: Date
  status: 'pending' | 'paid' | 'overdue' | 'waived' | 'partial'
  paidAmount: number
  paidDate?: Date
  paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online' | 'card'
  receiptNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const FeeSchema: Schema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'Student',
      index: true
    },
    feeType: {
      type: String,
      enum: ['tuition', 'activity', 'transport', 'library', 'technology', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived', 'partial'],
      default: 'pending',
      index: true
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paidDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'bank_transfer', 'online', 'card']
    },
    receiptNumber: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes for faster queries
FeeSchema.index({ studentId: 1, dueDate: -1 })
FeeSchema.index({ studentId: 1, status: 1 })
FeeSchema.index({ dueDate: 1 })

export default mongoose.model<IFee>('Fee', FeeSchema)

