// Error Handling Utilities
import { Response } from 'express'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export const handleError = (err: Error | AppError, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    })
  }

  console.error('Unexpected error:', err)
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
}

export const asyncHandler = (fn: (req: any, res: Response, next: (err?: any) => void) => Promise<any>) => {
  return (req: any, res: Response, next: (err?: any) => void) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

