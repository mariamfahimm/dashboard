// UpcomingAssignments - Shows next 3-5 upcoming assignments (compact)
import React, { useMemo } from 'react'
import { Card } from '../ui/Card'
import { EmptyState } from '../EmptyState'
import { Badge } from '../ui/Badge'

interface Assignment {
  _id: string
  title: string
  subject?: string
  dueDate?: string
  status?: string
  courseId?: string
}

interface UpcomingAssignmentsProps {
  assignments?: Assignment[]
  loading?: boolean
  maxItems?: number
  t?: (key: string) => string
  locale?: string
  onViewAll?: () => void
}

export function UpcomingAssignments({
  assignments,
  loading,
  maxItems = 5,
  t,
  locale,
  onViewAll,
}: UpcomingAssignmentsProps) {
  // Sort and filter upcoming assignments
  const upcomingAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return []

    const now = new Date()
    const sorted = assignments
      .filter((a) => {
        if (!a.dueDate) return false
        const dueDate = new Date(a.dueDate)
        return dueDate >= now && a.status !== 'completed' && a.status !== 'cancelled'
      })
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return dateA - dateB
      })
      .slice(0, maxItems)

    return sorted
  }, [assignments, maxItems])

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t?.('today') || (locale === 'ar' ? 'اليوم' : 'Today')
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t?.('tomorrow') || (locale === 'ar' ? 'غداً' : 'Tomorrow')
    }
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      calendar: 'gregory',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status?: string) => {
    if (status === 'completed') {
      return <Badge variant="success" size="sm">{t?.('completed') || 'Completed'}</Badge>
    }
    if (status === 'cancelled') {
      return <Badge variant="danger" size="sm">{t?.('cancelled') || 'Cancelled'}</Badge>
    }
    return <Badge variant="warning" size="sm">{t?.('active') || t?.('inProgress') || 'Active'}</Badge>
  }

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-8" padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t?.('upcomingAssignments') || 'Upcoming Assignments'}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="col-span-12 md:col-span-8" padding="md">
      <div className={`flex items-center justify-between mb-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        <h3 className="font-semibold text-slate-900">{t?.('upcomingAssignments') || 'Upcoming Assignments'}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {t?.('viewAll') || 'View All'} {locale === 'ar' ? '←' : '→'}
          </button>
        )}
      </div>
      {upcomingAssignments.length === 0 ? (
        <EmptyState
          icon="📝"
          title={t?.('noUpcomingAssignments') || 'No Upcoming Assignments'}
          message={t?.('noUpcomingAssignmentsMessage') || 'All caught up! No upcoming assignments.'}
          className="p-4"
        />
      ) : (
        <div className="space-y-3">
          {upcomingAssignments.map((assignment) => (
            <div
              key={assignment._id}
              className={`flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-slate-900 truncate mb-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {assignment.title}
                </div>
                <div className={`flex items-center gap-2 text-sm text-slate-600 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {assignment.subject && (
                    <>
                      <span>{assignment.subject}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatDate(assignment.dueDate)}</span>
                </div>
              </div>
              <div className={locale === 'ar' ? 'mr-4' : 'ml-4'}>
                {getStatusBadge(assignment.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

