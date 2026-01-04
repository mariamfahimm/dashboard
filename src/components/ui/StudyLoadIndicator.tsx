/**
 * Study Load Indicator
 * Shows weekly study load based on assignments and exams
 */
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'

interface StudyLoadIndicatorProps {
  weekStart: Date
  assignments: number
  exams: number
  averageHoursPerAssignment: number
  averageHoursPerExam: number
  className?: string
}

export function StudyLoadIndicator({
  weekStart,
  assignments,
  exams,
  averageHoursPerAssignment,
  averageHoursPerExam,
  className = ''
}: StudyLoadIndicatorProps) {
  const estimatedHours =
    assignments * averageHoursPerAssignment + exams * averageHoursPerExam

  const getLoadLevel = (hours: number): {
    level: 'light' | 'moderate' | 'heavy' | 'very-heavy'
    color: string
    bgColor: string
    label: string
  } => {
    if (hours <= 5) {
      return {
        level: 'light',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Light Load'
      }
    } else if (hours <= 10) {
      return {
        level: 'moderate',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Moderate Load'
      }
    } else if (hours <= 15) {
      return {
        level: 'heavy',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        label: 'Heavy Load'
      }
    } else {
      return {
        level: 'very-heavy',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Very Heavy Load'
      }
    }
  }

  const load = getLoadLevel(estimatedHours)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const percentage = Math.min(100, (estimatedHours / 20) * 100) // Assuming 20 hours is max for a week

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Study Load This Week</h3>
          <p className="text-sm text-slate-600">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Badge className={`${load.bgColor} ${load.color} border-0`}>
          {load.label}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Estimated Study Time
          </span>
          <span className="text-lg font-bold text-slate-900">{estimatedHours} hours</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${load.bgColor} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-slate-700">Assignments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{assignments}</p>
          <p className="text-xs text-slate-500">
            ~{assignments * averageHoursPerAssignment} hours
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-slate-700">Exams</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{exams}</p>
          <p className="text-xs text-slate-500">
            ~{exams * averageHoursPerExam} hours
          </p>
        </div>
      </div>

      {load.level === 'very-heavy' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ This is a very busy week. Consider prioritizing tasks and spreading study time
            across multiple days.
          </p>
        </div>
      )}
    </Card>
  )
}

// Badge component helper

