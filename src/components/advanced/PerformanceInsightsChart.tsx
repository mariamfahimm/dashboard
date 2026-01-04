// Performance Insights Chart Component
import React from 'react'
import { usePerformanceContext } from '@/context/PerformanceContext'

export function PerformanceInsightsChart() {
  const { metrics, insights, riskScore, loading, error } = usePerformanceContext()

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-slate-500">Loading performance insights...</div>
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

  if (!metrics) {
    return null
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Performance Insights</h3>
        <div className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600">
          Score: {metrics.overallScore}%
        </div>
      </div>

      {/* Risk Score */}
      {riskScore !== null && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50">
          <div className="text-xs text-slate-500 mb-1">Risk Score</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-200">
              <div 
                className={`h-2 rounded-full ${
                  riskScore < 30 ? 'bg-emerald-500' :
                  riskScore < 50 ? 'bg-amber-500' :
                  riskScore < 70 ? 'bg-orange-500' : 'bg-rose-500'
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">{riskScore}</span>
          </div>
        </div>
      )}

      {/* Weekly Progress Chart */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 mb-2">Weekly Progress</div>
        <div className="flex items-end gap-2 h-32">
          {metrics.weeklyProgress.map((point, idx) => {
            const maxValue = Math.max(...metrics.weeklyProgress.map(p => p.score))
            const height = (point.score / maxValue) * 100
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t bg-brand-500 transition-all"
                  style={{ height: `${height}%` }}
                />
                <div className="text-[10px] text-slate-500">{point.week}</div>
                <div className="text-xs font-medium text-slate-700">{point.score}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 mb-2">Subject Breakdown</div>
        <div className="grid gap-2">
          {metrics.subjectBreakdown.map((subject, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-20 text-sm text-slate-700">{subject.subject}</div>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div 
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${subject.score}%` }}
                />
              </div>
              <div className="w-16 text-xs text-slate-600 text-right">
                {subject.score}%
                {subject.change !== 0 && (
                  <span className={`ml-1 ${subject.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {subject.change > 0 ? '+' : ''}{subject.change}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">AI Insights</div>
          <div className="grid gap-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl text-sm ${
                  insight.type === 'strength' ? 'bg-emerald-50 text-emerald-700' :
                  insight.type === 'weakness' ? 'bg-rose-50 text-rose-700' :
                  'bg-amber-50 text-amber-700'
                }`}
              >
                <div className="font-medium mb-1">{insight.subject}</div>
                <div>{insight.message}</div>
                <div className="text-xs mt-1 opacity-75">
                  Confidence: {Math.round(insight.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

