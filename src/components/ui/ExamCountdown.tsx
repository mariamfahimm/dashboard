/**
 * Exam Countdown Component
 * Shows countdown to upcoming exams with study load indicator
 */
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'

interface Exam {
  id: string
  title: string
  subject: string
  date: Date
  weight: 'low' | 'medium' | 'high' // Exam importance/weight
}

interface ExamCountdownProps {
  exams: Exam[]
  className?: string
}

export function ExamCountdown({ exams, className = '' }: ExamCountdownProps) {
  const now = new Date()
  const upcomingExams = exams
    .filter(exam => exam.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5) // Show next 5 exams

  if (upcomingExams.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No upcoming exams</p>
          <p className="text-sm text-slate-500 mt-1">All clear!</p>
        </div>
      </Card>
    )
  }

  const getDaysUntil = (date: Date): number => {
    const diff = date.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getUrgencyColor = (days: number): string => {
    if (days <= 7) return 'bg-red-100 text-red-800 border-red-200'
    if (days <= 14) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getWeightBadge = (weight: string) => {
    const variants = {
      high: { label: 'High Weight', color: 'bg-red-500' },
      medium: { label: 'Medium', color: 'bg-amber-500' },
      low: { label: 'Low Weight', color: 'bg-green-500' }
    }
    const variant = variants[weight as keyof typeof variants] || variants.medium
    return (
      <Badge className={`${variant.color} text-white text-xs`}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Upcoming Exams</h3>
        <Badge className="bg-brand-500 text-white">
          {upcomingExams.length} {upcomingExams.length === 1 ? 'Exam' : 'Exams'}
        </Badge>
      </div>

      <div className="space-y-3">
        {upcomingExams.map(exam => {
          const daysUntil = getDaysUntil(exam.date)
          const isUrgent = daysUntil <= 7

          return (
            <div
              key={exam.id}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${getUrgencyColor(daysUntil)}
                ${isUrgent ? 'ring-2 ring-offset-2 ring-red-300' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{exam.title}</h4>
                    {getWeightBadge(exam.weight)}
                  </div>
                  <p className="text-sm text-slate-600">{exam.subject}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{daysUntil}</div>
                  <div className="text-xs text-slate-600">
                    {daysUntil === 1 ? 'day' : 'days'} left
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {exam.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  {isUrgent && (
                    <span className="font-medium text-red-900">⚠️ Study time!</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {upcomingExams.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Showing next 5 exams. Check calendar for more.
          </p>
        </div>
      )}
    </Card>
  )
}

