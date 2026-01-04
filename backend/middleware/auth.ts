// Authentication Middleware
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { AppError } from '../utils/errors'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthRequest extends Request {
  user?: any
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else {
      next(error)
    }
  }
}

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      const user = await User.findById(decoded.userId).select('-password')
      if (user) {
        req.user = user
      }
    }
    next()
  } catch (error) {
    // Ignore errors for optional auth
    next()
  }
}

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. Required roles: ${roles.join(', ')}`, 403)
      )
    }

    next()
  }
}

