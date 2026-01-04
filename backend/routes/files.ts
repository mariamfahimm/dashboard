// File Upload Routes (Dev-only)
import { Router } from 'express'
import {
  uploadAssignmentFile,
  getAssignmentFiles,
  deleteFile
} from '../controllers/fileController'

const router = Router()

// POST /api/files/assignment/:assignmentId
router.post('/assignment/:assignmentId', uploadAssignmentFile)

// GET /api/files/assignment/:assignmentId
router.get('/assignment/:assignmentId', getAssignmentFiles)

// DELETE /api/files/:fileId
router.delete('/:fileId', deleteFile)

export default router

