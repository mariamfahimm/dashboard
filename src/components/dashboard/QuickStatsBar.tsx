// QuickStatsBar - Horizontal KPI bar at top of dashboard
import React from 'react'
import { Card } from '../ui/Card'

interface QuickStatsBarProps {
  averageGrade?: number | null
  attendanceRate?: number | string
  pendingAssignments?: number
  unreadMessages?: number
  localizeDigits?: (value: any) => string
  onViewGradebook?: () => void
  onViewAssignments?: () => void
  onViewMessages?: () => void
  t?: (key: string) => string
}

export function QuickStatsBar({
  averageGrade,
  attendanceRate = '80%',
  pendingAssignments = 0,
  unreadMessages = 0,
  localizeDigits,
  onViewGradebook,
  onViewAssignments,
  onViewMessages,
  t,
}: QuickStatsBarProps) {
  const StatItem = ({ 
    label, 
    value, 
    icon, 
    color = 'text-brand-600',
    bgGradient = 'from-blue-50 to-blue-100',
    borderColor = 'border-blue-200',
    onClick 
  }: { 
    label: string
    value: string | number
    icon: string
    color?: string
    bgGradient?: string
    borderColor?: string
    onClick?: () => void
  }) => (
    <div
      onClick={onClick}
      className={`
        flex-1 rounded-xl bg-gradient-to-br ${bgGradient} border ${borderColor}
        px-4 py-4 shadow-sm
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white/60 backdrop-blur-sm`}>
          <span className="text-xl">{icon}</span>
        </div>
        <span className={`text-2xl font-bold ${color}`}>
          {localizeDigits ? localizeDigits(value) : value}
        </span>
      </div>
      <div className="text-xs text-slate-700 font-semibold">{label}</div>
    </div>
  )

  return (
    <div className="col-span-12 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatItem
          label={t?.('averageGrade') || 'Average Grade'}
          value={averageGrade !== null && averageGrade !== undefined ? `${averageGrade}%` : '—'}
          icon="📊"
          color="text-blue-700"
          bgGradient="from-blue-50 to-blue-100"
          borderColor="border-blue-200"
          onClick={onViewGradebook}
        />
        <StatItem
          label={t?.('attendance') || 'Attendance'}
          value={attendanceRate}
          icon="📅"
          color="text-emerald-700"
          bgGradient="from-emerald-50 to-emerald-100"
          borderColor="border-emerald-200"
        />
        <StatItem
          label={t?.('pendingTasks') || 'Pending Tasks'}
          value={pendingAssignments}
          icon="📝"
          color="text-amber-700"
          bgGradient="from-amber-50 to-amber-100"
          borderColor="border-amber-200"
          onClick={onViewAssignments}
        />
        <StatItem
          label={t?.('messages') || 'Messages'}
          value={unreadMessages > 0 ? unreadMessages : '0'}
          icon="💬"
          color={unreadMessages > 0 ? 'text-rose-700' : 'text-slate-700'}
          bgGradient={unreadMessages > 0 ? 'from-rose-50 to-rose-100' : 'from-slate-50 to-slate-100'}
          borderColor={unreadMessages > 0 ? 'border-rose-200' : 'border-slate-200'}
          onClick={onViewMessages}
        />
      </div>
    </div>
  )
}

