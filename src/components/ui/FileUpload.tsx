// File Upload Component for Messages
import React, { useRef, useState } from 'react'
import { HiX, HiPaperClip, HiCloudUpload } from 'react-icons/hi'

export interface FileAttachment {
  file: File
  url?: string
  id: string
}

interface FileUploadProps {
  files: FileAttachment[]
  onFilesChange: (files: FileAttachment[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
}

export function FileUpload({ 
  files, 
  onFilesChange, 
  maxFiles = 5, 
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', 'text/*']
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file: File): string => {
    const type = file.type
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.startsWith('text/')) return '📋'
    return '📎'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setError(null)
    const newFiles: FileAttachment[] = []

    Array.from(selectedFiles).forEach((file) => {
      // Check file count
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`)
        return
      }

      // Check file type
      const isAccepted = acceptedTypes.some(accepted => {
        if (accepted.endsWith('/*')) {
          const baseType = accepted.split('/')[0]
          return file.type.startsWith(baseType + '/')
        }
        if (accepted.startsWith('.')) {
          return file.name.toLowerCase().endsWith(accepted.toLowerCase())
        }
        return file.type === accepted
      })

      if (!isAccepted) {
        setError(`File type "${file.type}" is not allowed`)
        return
      }

      newFiles.push({
        file,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })
    })

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id))
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length === 0) return

    // Create a fake event to reuse handleFileSelect logic
    const fakeEvent = {
      target: {
        files: droppedFiles
      }
    } as any

    handleFileSelect(fakeEvent)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${files.length >= maxFiles
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/50 cursor-pointer'
          }
        `}
        onClick={() => {
          if (files.length < maxFiles && fileInputRef.current) {
            fileInputRef.current.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={files.length >= maxFiles}
        />
        <HiCloudUpload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700 mb-1">
          {files.length >= maxFiles 
            ? `Maximum ${maxFiles} files reached`
            : 'Click or drag files to upload'
          }
        </p>
        <p className="text-xs text-slate-500">
          Max {maxSizeMB}MB per file • {maxFiles - files.length} file{maxFiles - files.length !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <HiPaperClip className="w-4 h-4" />
            Attachments ({files.length})
          </div>
          <div className="space-y-2">
            {files.map((fileAttachment) => (
              <div
                key={fileAttachment.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="text-xl">{getFileIcon(fileAttachment.file)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {fileAttachment.file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(fileAttachment.file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(fileAttachment.id)
                  }}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                  aria-label="Remove file"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

