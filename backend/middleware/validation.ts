// Validation Middleware
import { Request, Response, NextFunction } from 'express'

export interface ValidationError {
  field: string
  message: string
}

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = []

    // Validate body
    if (schema.body) {
      for (const field in schema.body) {
        const rules = schema.body[field]
        const value = req.body[field]

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push({ field, message: `${field} is required` })
        }

        if (value !== undefined && value !== null && value !== '') {
          // Handle array type checking separately
          if (rules.type === 'array') {
            if (!Array.isArray(value)) {
              errors.push({ field, message: `${field} must be an array` })
            }
          } else if (rules.type && typeof value !== rules.type) {
            errors.push({ field, message: `${field} must be of type ${rules.type}` })
          }

          if (rules.min && typeof value === 'number' && value < rules.min) {
            errors.push({ field, message: `${field} must be at least ${rules.min}` })
          }

          if (rules.max && typeof value === 'number' && value > rules.max) {
            errors.push({ field, message: `${field} must be at most ${rules.max}` })
          }

          if (rules.enum && !rules.enum.includes(value)) {
            errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` })
          }

          if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push({ field, message: `${field} must be a valid email` })
          }
        }
      }
    }

    // Validate params
    if (schema.params) {
      for (const field in schema.params) {
        const rules = schema.params[field]
        const value = req.params[field]

        if (rules.required && !value) {
          errors.push({ field, message: `${field} is required` })
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ errors })
      return
    }

    next()
  }
}

