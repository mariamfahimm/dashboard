// TodaySchedule - Shows today's schedule only (compact)
import React, { useMemo } from 'react'
import { Card } from '../ui/Card'
import { EmptyState } from '../EmptyState'
import { useWeeklySchedule } from '../../hooks/useSchedule'

interface TodayScheduleProps {
  studentId?: string
  t?: (key: string) => string
  locale?: string
  onViewFull?: () => void
}

export function TodaySchedule({ studentId, t, locale, onViewFull }: TodayScheduleProps) {
  const { weeklySchedule, loading } = useWeeklySchedule(studentId)

  // Get current day - WeeklySchedule uses: 0=Sunday, 1=Monday, ..., 6=Saturday
  const currentDay = useMemo(() => {
    return new Date().getDay() // Returns 0=Sunday, 1=Monday, ..., 6=Saturday (matches WeeklySchedule)
  }, [])

  // Get today's schedule entries
  const todaySchedule = useMemo(() => {
    if (!weeklySchedule) return []
    // weeklySchedule uses keys 0-6 where 0=Sunday, 1=Monday, etc.
    const dayEntries = weeklySchedule[currentDay as keyof typeof weeklySchedule] || []
    return dayEntries
      .sort((a, b) => (a.period || 0) - (b.period || 0))
      .slice(0, 5) // Show max 5 entries
  }, [weeklySchedule, currentDay])

  const dayNames = locale === 'ar' 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[currentDay]

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-4" padding="md">
        <div className={`flex items-center justify-between mb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <h3 className="font-semibold">{t?.('todaysSchedule') || 'Today\'s Schedule'}</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="col-span-12 md:col-span-4" padding="md">
      <div className={`flex items-center justify-between mb-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
        <h3 className="font-semibold">{locale === 'ar' ? `جدول ${todayName}` : `${todayName}'s Schedule`}</h3>
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            {t?.('viewFull') || 'View Full'} {locale === 'ar' ? '←' : '→'}
          </button>
        )}
      </div>
      {todaySchedule.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t?.('noScheduleToday') || 'No Classes Today'}
          message={t?.('noScheduleTodayMessage') || 'No classes scheduled for today.'}
          className="p-4"
        />
      ) : (
        <div className="space-y-2">
          {todaySchedule.map((entry, idx) => (
            <div
              key={entry._id || idx}
              className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`text-xs font-semibold text-slate-500 w-16 ${locale === 'ar' ? 'text-left' : 'text-left'}`}>
                  {entry.startTime}
                </div>
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <div className="text-sm font-medium text-slate-900">
                    {entry.course?.subject || entry.course?.title || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {entry.room || (t?.('roomTBD') || (locale === 'ar' ? 'الغرفة قيد التحديد' : 'Room TBD'))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

