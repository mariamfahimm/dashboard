/**
 * Expandable Advanced Section
 * Progressive disclosure for advanced features with clear CTAs
 */
import React, { useState } from 'react'
import { Button } from './Button'

interface ExpandableAdvancedSectionProps {
  title: string
  description: string
  isAdvanced?: boolean
  onExpand: () => void
  t: (key: string) => string
  children?: React.ReactNode
}

export function ExpandableAdvancedSection({
  title,
  description,
  isAdvanced = false,
  onExpand,
  t,
  children
}: ExpandableAdvancedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isExpanded && children) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5 border-2 border-brand-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {isAdvanced && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {t('advanced') || 'Advanced'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={t('collapse') || 'Collapse'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 p-5 hover:border-brand-400 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-slate-900">{title}</h3>
            {isAdvanced && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                {t('advanced') || 'Advanced'}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {t('optional') || 'Optional'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsExpanded(true)
              onExpand()
            }}
          >
            {t('viewMoreInsights') || 'View More Insights'} →
          </Button>
        </div>
        <div className="text-3xl opacity-50">📊</div>
      </div>
    </div>
  )
}

