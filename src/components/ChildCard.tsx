// Beautiful Child Card Component with exceptional UI
import React from 'react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Avatar } from './ui/Avatar'

interface ChildCardProps {
  student: {
    _id: string
    name: string
    gradeLevel?: number
    studentId?: string
    photo?: string
    avatar?: string
    class?: string
    homeroomTeacher?: string
    averageGrade?: number
    attendanceRate?: number
  }
  isSelected?: boolean
  onClick?: () => void
  showRequestLink?: boolean
}

export function ChildCard({ student, isSelected = false, onClick, showRequestLink = false }: ChildCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        ${isSelected ? 'scale-[1.02] z-10' : 'hover:scale-[1.02]'}
      `}
    >
      {/* Card matching dashboard style */}
      <div
        className={`
          relative overflow-hidden rounded-2xl transition-all duration-300 ease-out
          ${isSelected 
            ? 'bg-white border-2 border-brand-500 shadow-xl shadow-brand-500/20' 
            : 'bg-white border border-slate-200 hover:border-brand-300 hover:shadow-lg'
          }
        `}
      >
        {/* Selection indicator matching dashboard brand colors */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Subtle brand gradient overlay when selected */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-transparent to-indigo-50/50 pointer-events-none"></div>
        )}

        <div className="p-6 relative z-10">
          {/* Header with avatar matching dashboard style */}
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar with brand colors */}
            <div className={`
              relative flex-shrink-0
              ${isSelected 
                ? 'ring-2 ring-brand-400 shadow-lg shadow-brand-500/30' 
                : 'ring-1 ring-slate-200 group-hover:ring-brand-200'
              }
              rounded-2xl transition-all duration-300 ease-out
              ${isSelected ? '' : 'group-hover:scale-105'}
            `}>
              <div className="rounded-2xl overflow-hidden bg-slate-50 p-1">
                <Avatar 
                  name={student.name}
                  src={student.avatar || student.photo}
                  size="xl"
                  showOnlineIndicator
                  isOnline
                  className="rounded-xl"
                />
              </div>
              {isSelected && (
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-2xl blur opacity-30 -z-10"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
              <h3 className={`
                font-bold text-xl mb-2 truncate
                ${isSelected ? 'text-slate-900' : 'text-slate-900'}
              `}>
                {student.name}
              </h3>
              {student.gradeLevel && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">Grade {student.gradeLevel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row matching dashboard style */}
          {(student.averageGrade !== undefined || student.attendanceRate !== undefined) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {student.averageGrade !== undefined && (
                <div className={`
                  rounded-xl p-4 border
                  ${isSelected 
                    ? 'bg-brand-50 border-brand-200' 
                    : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100'
                  }
                  transition-all duration-300
                `}>
                  <div className="text-xs mb-2 font-medium text-slate-500 uppercase tracking-wider">
                    Average
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {student.averageGrade}%
                  </div>
                </div>
              )}
              {student.attendanceRate !== undefined && (
                <div className={`
                  rounded-xl p-4 border
                  ${isSelected 
                    ? 'bg-indigo-50 border-indigo-200' 
                    : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100'
                  }
                  transition-all duration-300
                `}>
                  <div className="text-xs mb-2 font-medium text-slate-500 uppercase tracking-wider">
                    Attendance
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {student.attendanceRate}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action button matching dashboard brand colors */}
          <div className={`
            mt-6 pt-6 border-t
            ${isSelected ? 'border-brand-200' : 'border-slate-200'}
          `}>
            <div className={`
              text-center py-3 px-6 rounded-xl font-semibold text-sm
              transition-all duration-300
              ${isSelected 
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40' 
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:border-slate-300'
              }
              flex items-center justify-center gap-2
            `}>
              <span>{isSelected ? 'View Dashboard' : 'Click to View'}</span>
              <svg className={`w-5 h-5 transition-transform ${isSelected ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

