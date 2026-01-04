// Personalized Recommendation Card Component
import React from 'react'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { RecommendationContext } from '@/services/recommendationService'

const categoryIcons: Record<string, string> = {
  study_plan: '📚',
  resource: '📖',
  activity: '🎯',
  goal: '🎯',
  intervention: '💡'
}

const categoryColors: Record<string, string> = {
  study_plan: 'bg-violet-50 text-violet-700 border-violet-200',
  resource: 'bg-blue-50 text-blue-700 border-blue-200',
  activity: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  goal: 'bg-amber-50 text-amber-700 border-amber-200',
  intervention: 'bg-rose-50 text-rose-700 border-rose-200'
}

interface RecommendationCardProps {
  context: RecommendationContext
  maxRecommendations?: number
}

export function RecommendationCard({ context, maxRecommendations = 5 }: RecommendationCardProps) {
  const { 
    topRecommendations, 
    loading, 
    error, 
    accept, 
    dismiss 
  } = useRecommendations(context)

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-slate-500">Loading recommendations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-rose-600">Error: {error}</div>
      </div>
    )
  }

  const displayed = topRecommendations.slice(0, maxRecommendations)

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Personalized Recommendations</h3>
        <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
          {topRecommendations.length} total
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          No recommendations at this time
        </div>
      ) : (
        <div className="grid gap-3">
          {displayed.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border ${categoryColors[rec.category] || 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoryIcons[rec.category] || '💡'}</span>
                  <div>
                    <div className="text-sm font-medium">{rec.title}</div>
                    <div className="text-xs opacity-75 mt-0.5">{rec.category.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-xs px-2 py-1 rounded-full bg-white/50">
                    Priority {rec.priority}
                  </div>
                </div>
              </div>

              <div className="text-xs mb-3 opacity-90">{rec.description}</div>

              {rec.reasoning && (
                <div className="text-[10px] mb-3 p-2 rounded bg-white/50">
                  <span className="font-medium">Why:</span> {rec.reasoning}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-[10px] opacity-75">
                  Confidence: {Math.round(rec.confidence * 100)}%
                </div>
                <div className="flex items-center gap-2">
                  {rec.actionUrl && (
                    <a
                      href={rec.actionUrl}
                      className="text-xs px-3 py-1 rounded bg-white hover:bg-white/80 font-medium"
                    >
                      View →
                    </a>
                  )}
                  <button
                    onClick={() => accept(rec.id)}
                    className="text-xs px-3 py-1 rounded bg-white hover:bg-white/80 font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => dismiss(rec.id)}
                    className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/70"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {topRecommendations.length > maxRecommendations && (
        <div className="mt-4 text-center">
          <button className="text-xs text-brand-600 hover:text-brand-700">
            View all {topRecommendations.length} recommendations →
          </button>
        </div>
      )}
    </div>
  )
}

