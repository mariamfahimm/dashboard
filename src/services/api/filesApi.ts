// File Upload API Service (Dev-only)
import { apiClient } from '../../utils/apiClient'

export interface FileMetadata {
  id: string
  assignmentId: string
  filename: string
  size: number
  mimeType: string
  url: string
  description?: string
  uploadedAt: string
  status: 'accepted' | 'processing' | 'completed' | 'failed'
}

export interface FileUploadData {
  filename: string
  size?: number
  mimeType?: string
  url?: string
  description?: string
}

export const filesApi = {
  /**
   * Upload file metadata for an assignment
   * Note: This endpoint is only available in development mode
   */
  uploadForAssignment: (assignmentId: string, data: FileUploadData) => {
    return apiClient.post<{ success: boolean; message: string; data: FileMetadata }>(
      `/files/assignment/${assignmentId}`,
      data
    )
  },

  /**
   * Get all files for an assignment
   */
  getForAssignment: (assignmentId: string) => {
    return apiClient.get<{ success: boolean; count: number; data: FileMetadata[]; message?: string }>(
      `/files/assignment/${assignmentId}`
    )
  },

  /**
   * Delete file metadata
   */
  delete: (fileId: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/files/${fileId}`)
  },
}

