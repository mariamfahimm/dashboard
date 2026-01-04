/**
 * Notification Preferences Component
 * Allows parents to control notification settings
 */
import React, { useState, useEffect } from 'react'
import { Card } from './Card'

export interface NotificationCategory {
  id: string
  label: string
  description: string
  enabled: boolean
  urgencyThreshold: 'low' | 'medium' | 'high' | 'critical'
  frequency: 'instant' | 'daily' | 'weekly'
}

interface NotificationPreferencesProps {
  studentId?: string
  onPreferencesChange?: (preferences: NotificationCategory[]) => void
  className?: string
}

const defaultCategories: NotificationCategory[] = [
  {
    id: 'grades',
    label: 'New Grades',
    description: 'When new grades are posted',
    enabled: true,
    urgencyThreshold: 'low',
    frequency: 'instant'
  },
  {
    id: 'assignments',
    label: 'Assignments',
    description: 'Assignment due dates and reminders',
    enabled: true,
    urgencyThreshold: 'medium',
    frequency: 'instant'
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Absences and attendance alerts',
    enabled: true,
    urgencyThreshold: 'high',
    frequency: 'instant'
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'New messages from teachers',
    enabled: true,
    urgencyThreshold: 'low',
    frequency: 'instant'
  },
  {
    id: 'alerts',
    label: 'Important Alerts',
    description: 'Critical alerts and warnings',
    enabled: true,
    urgencyThreshold: 'critical',
    frequency: 'instant'
  },
  {
    id: 'fees',
    label: 'Fees & Payments',
    description: 'Payment reminders and confirmations',
    enabled: true,
    urgencyThreshold: 'medium',
    frequency: 'daily'
  },
  {
    id: 'events',
    label: 'Events',
    description: 'School events and calendar items',
    enabled: true,
    urgencyThreshold: 'low',
    frequency: 'daily'
  }
]

export function NotificationPreferences({
  studentId,
  onPreferencesChange,
  className = ''
}: NotificationPreferencesProps) {
  const [categories, setCategories] = useState<NotificationCategory[]>(() => {
    // Load from localStorage
    try {
      const key = studentId ? `notifications_${studentId}` : 'notifications_default'
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    }
    return defaultCategories
  })

  const [seniorFocusMode, setSeniorFocusMode] = useState(() => {
    try {
      const key = studentId ? `senior_focus_mode_${studentId}` : 'senior_focus_mode'
      return localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  })

  // Save to localStorage when preferences change
  useEffect(() => {
    try {
      const key = studentId ? `notifications_${studentId}` : 'notifications_default'
      localStorage.setItem(key, JSON.stringify(categories))
      onPreferencesChange?.(categories)
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    }
  }, [categories, studentId, onPreferencesChange])

  // Save senior focus mode
  useEffect(() => {
    try {
      const key = studentId ? `senior_focus_mode_${studentId}` : 'senior_focus_mode'
      localStorage.setItem(key, seniorFocusMode.toString())
    } catch (error) {
      console.error('Error saving senior focus mode:', error)
    }
  }, [seniorFocusMode, studentId])

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
      )
    )
  }

  const updateUrgencyThreshold = (id: string, threshold: NotificationCategory['urgencyThreshold']) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, urgencyThreshold: threshold } : cat
      )
    )
  }

  const updateFrequency = (id: string, frequency: NotificationCategory['frequency']) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, frequency } : cat
      )
    )
  }

  // Apply senior focus mode - only show critical notifications
  const displayCategories = seniorFocusMode
    ? categories.filter(cat => cat.urgencyThreshold === 'critical' || cat.id === 'alerts')
    : categories

  return (
    <Card className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Notification Preferences</h3>
        <p className="text-sm text-slate-600">
          Control when and how you receive notifications
        </p>
      </div>

      {/* Senior Focus Mode Toggle */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-semibold text-slate-900">Senior Year Focus Mode</div>
            <p className="text-sm text-slate-600 mt-1">
              Only receive critical notifications (exams, deadlines, fees, graduation items)
            </p>
          </div>
          <input
            type="checkbox"
            checked={seniorFocusMode}
            onChange={(e) => setSeniorFocusMode(e.target.checked)}
            className="w-5 h-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 focus:ring-2"
          />
        </label>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {displayCategories.map(category => (
          <div
            key={category.id}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${category.enabled ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-slate-50'}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={() => toggleCategory(category.id)}
                    className="w-5 h-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 focus:ring-2"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">{category.label}</h4>
                    <p className="text-sm text-slate-600">{category.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {category.enabled && (
              <div className="ml-8 space-y-3">
                {/* Urgency Threshold */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Only notify for:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map(threshold => (
                      <button
                        key={threshold}
                        type="button"
                        onClick={() => updateUrgencyThreshold(category.id, threshold)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                          ${
                            category.urgencyThreshold === threshold
                              ? 'bg-brand-500 text-white'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }
                        `}
                      >
                        {threshold.charAt(0).toUpperCase() + threshold.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Frequency:
                  </label>
                  <select
                    value={category.frequency}
                    onChange={(e) => updateFrequency(category.id, e.target.value as NotificationCategory['frequency'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {seniorFocusMode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Focus Mode Active:</strong> Only critical notifications and important alerts
            are enabled. All other notifications are temporarily disabled.
          </p>
        </div>
      )}
    </Card>
  )
}

