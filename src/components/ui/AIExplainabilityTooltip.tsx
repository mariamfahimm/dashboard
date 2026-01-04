/**
 * AI Explainability Tooltip Component
 * Shows why an AI insight/forecast/recommendation is being shown
 */
import React, { useState } from 'react'
import { getConfidenceLabel } from '../../utils/gradeModeUtils'

interface AIExplainabilityTooltipProps {
  dataSources: string[]
  timeRange: string
  confidence: number
  changeFactors?: string[]
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function AIExplainabilityTooltip({
  dataSources,
  timeRange,
  confidence,
  changeFactors = [],
  children,
  position = 'top'
}: AIExplainabilityTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const confidenceInfo = getConfidenceLabel(confidence)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Why am I seeing this?"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-bold">?</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Tooltip */}
          <div
            className={`
              absolute z-50 w-72 p-4 bg-white rounded-lg shadow-xl border border-slate-200
              ${positionClasses[position]}
            `}
            role="tooltip"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-900">Why am I seeing this?</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              {/* Data Sources */}
              <div>
                <p className="font-medium text-slate-700 mb-1">Based on:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {dataSources.map((source, idx) => (
                    <li key={idx}>{source}</li>
                  ))}
                </ul>
              </div>

              {/* Time Range */}
              <div>
                <p className="font-medium text-slate-700 mb-1">Time period:</p>
                <p>{timeRange}</p>
              </div>

              {/* Confidence */}
              <div>
                <p className="font-medium text-slate-700 mb-1">Confidence:</p>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${confidenceInfo.color}`}>
                    {confidenceInfo.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({Math.round(confidence * 100)}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{confidenceInfo.description}</p>
              </div>

              {/* Change Factors */}
              {changeFactors.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">What could change this:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {changeFactors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 italic">
                  Predictions are guidance, not guarantees. Use them alongside your judgment.
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45
                ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
                ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
                ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
                ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
              `}
            />
          </div>
        </>
      )}

      {children}
    </div>
  )
}

