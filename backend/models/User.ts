// User Model
import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'student' | 'teacher' | 'admin' | 'parent'
  phone?: string
  address?: string
  mustChangePassword?: boolean // Require password change on first login
  passwordChangedAt?: Date // Track when password was last changed
  language?: 'en' | 'ar' // User's preferred language
  preferences?: {
    notifications: {
      email: boolean
      push: boolean
      grades: boolean
      assignments: boolean
      attendance: boolean
      behavior: boolean
      messages: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'parent'],
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    passwordChangedAt: {
      type: Date
    },
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en'
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        grades: { type: Boolean, default: true },
        assignments: { type: Boolean, default: true },
        attendance: { type: Boolean, default: true },
        behavior: { type: Boolean, default: true },
        messages: { type: Boolean, default: true }
      }
    }
  },
  {
    timestamps: true
  }
)

// Indexes
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ role: 1 })

export default mongoose.model<IUser>('User', UserSchema)

