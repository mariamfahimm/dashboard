// Student Selection Component - Appears after login to let parents choose which child to monitor
import React, { useState, useEffect } from 'react'
import { useStudents } from '../hooks/useStudents'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from './EmptyState'
import { createT } from '../i18n'
import { translateName } from '../utils/nameTranslations'

interface StudentSelectionProps {
  onSelect: (studentId: string) => void
  onSkip?: () => void
  t?: (key: string) => string
  locale?: string
}

export function StudentSelection({ onSelect, onSkip, t, locale }: StudentSelectionProps) {
  // Load locale from localStorage if not provided
  const actualLocale = locale || localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
  const isRTL = actualLocale === 'ar'
  
  // Use provided t function or create one with the locale
  const actualT = t || createT(actualLocale)
  
  const { user } = useAuth()
  const { students, loading, error } = useStudents(user?._id)
  const [selectedId, setSelectedId] = useState('')

  // Auto-select if only one student
  useEffect(() => {
    if (students && students.length === 1) {
      setSelectedId(students[0]._id)
      // Auto-proceed after a brief moment
      setTimeout(() => {
        onSelect(students[0]._id)
      }, 500)
    }
  }, [students, onSelect])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedId) {
      onSelect(selectedId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-slate-600">{actualT('loadingStudents')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{actualT('errorLoadingStudents')}</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              {actualT('retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
          <EmptyState
            icon="👤"
            title={actualT('noStudentsFound')}
            message={actualT('noStudentsFoundMessage')}
          />
        </div>
      </div>
    )
  }

  // If only one student, show a brief confirmation screen
  if (students.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
          <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="h-16 w-16 rounded-full bg-brand-100 grid place-items-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{actualT('welcome')}</h2>
            <p className="text-slate-600 mb-6">
              {actualT('monitoring')}: <strong className="text-slate-900">{getStudentDisplayName(students[0], actualLocale)}</strong>
            </p>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            <p className="text-sm text-slate-500 mt-4">{actualT('loadingDashboard')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Multiple students - show selection screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className={`text-center mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="h-16 w-16 rounded-full bg-brand-100 grid place-items-center mx-auto mb-4">
            <span className="text-3xl">👨‍👩‍👧‍👦</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{actualT('selectStudent')}</h2>
          <p className="text-slate-600">{actualT('chooseWhichChildToMonitor')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            {students.map((student) => (
              <label
                key={student._id}
                className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedId === student._id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="student"
                    value={student._id}
                    checked={selectedId === student._id}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-5 h-5 text-brand-500 focus:ring-brand-500"
                  />
                  <div className="flex-1">
                    <div className={`font-semibold text-slate-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>{getStudentDisplayName(student, actualLocale)}</div>
                    <div className={`text-sm text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {actualT('grade')} {student.gradeLevel || actualT('nA')} • {actualT('studentID')}: {student.studentId || actualT('nA')}
                    </div>
                  </div>
                  {selectedId === student._id && (
                    <div className="text-brand-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={!selectedId}
            className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actualT('continueToDashboard')}
          </button>
        </form>
      </div>
    </div>
  )
}

