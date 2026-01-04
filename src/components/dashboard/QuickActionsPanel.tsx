// QuickActionsPanel - Quick navigation buttons for main pages
import React from 'react'
import { Card } from '../ui/Card'
import { HiCalendar, HiClock, HiCurrencyDollar, HiChat } from 'react-icons/hi'

interface QuickActionsPanelProps {
  onNavigate?: (route: string) => void
  t?: (key: string) => string
}

export function QuickActionsPanel({ onNavigate, t }: QuickActionsPanelProps) {
  const actions = [
    {
      icon: HiClock,
      label: t?.('timeTable') || 'Timetable',
      route: '#/timetable',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: HiCalendar,
      label: t?.('calendar') || 'Calendar',
      route: '#/calendar',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: HiCurrencyDollar,
      label: t?.('feesPayments') || t?.('fees') || 'Fees & Payments',
      route: '#/fees',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: HiChat,
      label: t?.('communicationHub') || 'Messages',
      route: '#/messages',
      color: 'from-purple-500 to-purple-600',
    },
  ]

  const handleClick = (route: string) => {
    if (onNavigate) {
      onNavigate(route)
    } else {
      window.location.hash = route
    }
  }

  return (
    <Card className="col-span-12 md:col-span-5" padding="lg">
      <h3 className="font-semibold text-slate-900 mb-4">{t?.('quickActions') || 'Quick Actions'}</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.route}
              onClick={() => handleClick(action.route)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                bg-gradient-to-br ${action.color} text-white
                hover:shadow-lg transition-all duration-200
                hover:scale-105 active:scale-95
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

