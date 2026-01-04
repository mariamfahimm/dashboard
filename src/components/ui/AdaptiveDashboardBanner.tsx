/**
 * Adaptive Dashboard Banner
 * First-time user welcome banner explaining the adaptive dashboard system
 */
import React, { useState } from 'react'
import { Button } from './Button'

interface AdaptiveDashboardBannerProps {
  onDismiss: () => void
  onCustomize: () => void
  t: (key: string) => string
  complexity: 'basic' | 'standard' | 'advanced'
  studentName?: string
}

export function AdaptiveDashboardBanner({
  onDismiss,
  onCustomize,
  t,
  complexity,
  studentName
}: AdaptiveDashboardBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const complexityLabels = {
    basic: t('basicView') || 'Basic View',
    standard: t('standardView') || 'Standard View',
    advanced: t('advancedView') || 'Advanced View'
  }

  return (
    <div className="col-span-12 mb-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✨</span>
            <h3 className="font-semibold text-slate-900">
              {t('welcomeToAdaptiveDashboard') || 'Welcome! Your dashboard adapts to you'}
            </h3>
          </div>
          <p className="text-sm text-slate-700 mb-3">
            {studentName && (
              <span>
                {t('adaptiveDashboardExplanation') || 
                  `Your dashboard is set to ${complexityLabels[complexity]} based on ${studentName}'s grade level. `}
              </span>
            )}
            {!studentName && (
              <span>
                {t('adaptiveDashboardExplanationGeneric') || 
                  `Your dashboard is set to ${complexityLabels[complexity]} based on your child's grade level. `}
              </span>
            )}
            {t('adaptiveDashboardExplanation2') || 
              'You can customize what you see, enable advanced features, or keep it simple. The dashboard learns from how you use it.'}
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => {
                onCustomize()
                setIsDismissed(true)
              }}
            >
              {t('customizeDashboard') || 'Customize Dashboard'}
            </Button>
            <button
              onClick={() => {
                setIsDismissed(true)
                onDismiss()
              }}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              {t('gotIt') || 'Got it'}
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setIsDismissed(true)
            onDismiss()
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={t('dismiss') || 'Dismiss'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

