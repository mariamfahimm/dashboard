// Authentication Controller
import { Request, Response } from 'express'
import User from '../models/User'
import { AppError, asyncHandler } from '../utils/errors'
import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  // expiresIn accepts string like '7d' or number in seconds
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions)
}

// POST /api/auth/register - Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body

  // Validate input
  if (!name || !email || !password || !role) {
    throw new AppError('All fields are required', 400)
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('User with this email already exists', 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  })

  // Generate token
  const token = generateToken(String(user._id))

  // Remove password from response
  const userResponse = user.toObject()
  delete (userResponse as any).password

  res.status(201).json({
    success: true,
    token,
    user: userResponse,
  })
})

// POST /api/auth/login - Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  // Find user
  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401)
  }

  // Check if password change is required
  if (user.mustChangePassword) {
    // Still generate token but include flag
    const token = generateToken(String(user._id))
    const userResponse = user.toObject()
    delete (userResponse as any).password

    res.json({
      success: true,
      token,
      user: userResponse,
      mustChangePassword: true,
      message: 'Please change your password on first login',
    })
    return
  }

  // Generate token
  const token = generateToken(String(user._id))

  // Remove password from response
  const userResponse = user.toObject()
  delete (userResponse as any).password

  res.json({
    success: true,
    token,
    user: userResponse,
  })
})

// GET /api/auth/me - Get current user
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user is set by auth middleware
  const user = (req as any).user

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Remove password from response
  const userResponse = user.toObject()
  const { password: _, ...userWithoutPassword } = userResponse

  res.json({
    success: true,
    data: userWithoutPassword,
  })
})

// POST /api/auth/logout - Logout (client-side token removal)
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Token removal is handled client-side
  res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

// POST /api/auth/impersonate - Impersonate user (DEMO MODE ONLY)
export const impersonate = asyncHandler(async (req: Request, res: Response) => {
  // Only allow in demo mode
  if (process.env.DEMO_MODE !== 'true' && process.env.NODE_ENV === 'production') {
    throw new AppError('Impersonation is disabled in production', 403)
  }

  const { email } = req.body
  const currentUser = (req as any).user

  // Only admins can impersonate
  if (!currentUser || currentUser.role !== 'admin') {
    throw new AppError('Only admins can impersonate users', 403)
  }

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  // Find user to impersonate
  const targetUser = await User.findOne({ email })
  if (!targetUser) {
    throw new AppError('User not found', 404)
  }

  // Generate token for target user
  const token = generateToken(String(targetUser._id))

  // Remove password from response
  const userResponse = targetUser.toObject()
  delete (userResponse as any).password

  res.json({
    success: true,
    token,
    user: userResponse,
    message: `Impersonating ${targetUser.name}`,
    demoMode: true
  })
})

// POST /api/auth/change-password - Change user password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  const userId = (req as any).user?._id || (req as any).user?.id

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400)
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400)
  }

  if (!userId) {
    throw new AppError('User not authenticated', 401)
  }

  // Find user
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 401)
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  user.password = hashedNewPassword
  user.mustChangePassword = false // Clear the flag
  user.passwordChangedAt = new Date() // Track when password was changed
  await user.save()

  res.json({
    success: true,
    message: 'Password changed successfully',
  })
})

