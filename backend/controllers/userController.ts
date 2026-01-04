// User Controller
import { Request, Response } from 'express'
import User from '../models/User'
import { AppError, asyncHandler } from '../utils/errors'
import bcrypt from 'bcryptjs'

// GET /api/users - Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query
  const filter: any = {}
  if (role) filter.role = role

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 })
  res.json({ success: true, count: users.length, data: users })
})

// GET /api/users/:id - Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password')
  
  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({ success: true, data: user })
})

// POST /api/users - Create new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body

  // Validate input
  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are required', 400)
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('User with this email already exists', 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({ name, email, password: hashedPassword, role })
  const userResponse = user.toObject()
  const { password: _, ...userWithoutPassword } = userResponse

  res.status(201).json({ success: true, data: userWithoutPassword })
})

// PUT /api/users/:id - Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, phone, address, preferences } = req.body
  const updateData: any = {}

  if (name) updateData.name = name
  if (email) {
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } })
    if (existingUser) {
      throw new AppError('Email already in use', 400)
    }
    updateData.email = email
  }
  if (role) updateData.role = role
  if (phone !== undefined) updateData.phone = phone
  if (address !== undefined) updateData.address = address
  if (preferences) updateData.preferences = preferences

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({ success: true, data: user })
})

// PUT /api/users/:id/preferences - Update user preferences
export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const { notifications } = req.body

  if (!notifications) {
    throw new AppError('Notification preferences are required', 400)
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Update preferences
  if (!user.preferences) {
    user.preferences = { notifications }
  } else {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...notifications
    }
  }

  await user.save()

  const userResponse = user.toObject()
  const { password: _, ...userWithoutPassword } = userResponse

  res.json({ success: true, data: userWithoutPassword, message: 'Preferences updated successfully' })
})

// DELETE /api/users/:id - Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({ success: true, message: 'User deleted successfully' })
})

