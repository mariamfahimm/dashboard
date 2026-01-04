// File Upload Metadata Controller (Dev-only)
import { Request, Response } from 'express'
import { AppError, asyncHandler } from '../utils/errors'
import Assignment from '../models/Assignment'

// Dev-only guard
function checkDevEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV
  const allowDemo = process.env.ALLOW_DEMO_SEED === 'true'
  
  if (nodeEnv === 'production' && !allowDemo) {
    throw new AppError('File upload endpoints are only available in development', 403)
  }
}

// POST /api/files/assignment/:assignmentId - Upload file metadata for assignment
export const uploadAssignmentFile = asyncHandler(async (req: Request, res: Response) => {
  checkDevEnvironment()

  const { assignmentId } = req.params
  const { filename, size, mimeType, url, description } = req.body

  // Verify assignment exists
  const assignment = await Assignment.findById(assignmentId)
  if (!assignment) {
    throw new AppError('Assignment not found', 404)
  }

  // Validate file metadata
  if (!filename) {
    throw new AppError('Filename is required', 400)
  }

  // Size limit: 50MB (dev-only, permissive)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (size && size > maxSize) {
    throw new AppError(`File size exceeds limit of ${maxSize / 1024 / 1024}MB`, 400)
  }

  // Allowed MIME types (dev-only, permissive)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ]

  if (mimeType && !allowedTypes.includes(mimeType)) {
    console.warn(`⚠️ Unusual MIME type: ${mimeType} (allowed in dev mode)`)
  }

  // Return accepted metadata (actual file storage is optional)
  const fileMetadata = {
    id: `file-${Date.now()}`,
    assignmentId,
    filename,
    size: size || 0,
    mimeType: mimeType || 'application/octet-stream',
    url: url || `http://localhost:4000/files/${assignmentId}/${filename}`,
    description: description || '',
    uploadedAt: new Date(),
    status: 'accepted'
  }

  res.status(201).json({
    success: true,
    message: 'File metadata accepted (dev mode - actual storage optional)',
    data: fileMetadata
  })
})

// GET /api/files/assignment/:assignmentId - Get files for assignment
export const getAssignmentFiles = asyncHandler(async (req: Request, res: Response) => {
  checkDevEnvironment()

  const { assignmentId } = req.params

  // Verify assignment exists
  const assignment = await Assignment.findById(assignmentId)
  if (!assignment) {
    throw new AppError('Assignment not found', 404)
  }

  // In a real implementation, this would query a File model
  // For dev mode, return empty array
  res.json({
    success: true,
    count: 0,
    data: [],
    message: 'File storage not implemented (dev mode)'
  })
})

// DELETE /api/files/:fileId - Delete file metadata
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  checkDevEnvironment()

  const { fileId } = req.params

  // In a real implementation, this would delete from File model and storage
  res.json({
    success: true,
    message: 'File metadata deleted (dev mode - actual file storage not implemented)'
  })
})

