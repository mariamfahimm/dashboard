/**
 * Feature Visibility Badge
 * Shows why a feature is visible or hidden with transparency
 */
import React from 'react'
import { Badge } from './Badge'

interface FeatureVisibilityBadgeProps {
  reason: 'default' | 'enabled' | 'disabled' | 'behavioral' | 'complexity'
  isVisible: boolean
  t: (key: string) => string
  className?: string
}

export function FeatureVisibilityBadge({
  reason,
  isVisible,
  t,
  className = ''
}: FeatureVisibilityBadgeProps) {
  if (!isVisible && reason === 'default') {
    return null // Don't show badge for hidden default features
  }

  const reasons = {
    enabled: {
      label: t('manuallyEnabled') || 'You enabled this',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: '✓'
    },
    disabled: {
      label: t('manuallyDisabled') || 'You disabled this',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      icon: '—'
    },
    behavioral: {
      label: isVisible 
        ? (t('shownBasedOnUsage') || 'Shown based on your usage')
        : (t('hiddenDueToLowUsage') || 'Hidden due to low usage'),
      color: isVisible
        ? 'text-blue-700 bg-blue-50 border-blue-200'
        : 'text-amber-700 bg-amber-50 border-amber-200',
      icon: isVisible ? '💡' : '⏱️'
    },
    complexity: {
      label: isVisible
        ? (t('availableInThisView') || 'Available in this view')
        : (t('requiresHigherComplexity') || 'Requires higher complexity level'),
      color: isVisible
        ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
        : 'text-slate-600 bg-slate-50 border-slate-200',
      icon: isVisible ? '📊' : '🔒'
    },
    default: {
      label: t('shownByDefault') || 'Shown by default',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      icon: '📋'
    }
  }

  const reasonInfo = reasons[reason]

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border ${reasonInfo.color} ${className}`}>
      <span>{reasonInfo.icon}</span>
      <span className="font-medium">{reasonInfo.label}</span>
    </div>
  )
}

