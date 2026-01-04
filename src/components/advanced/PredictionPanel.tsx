// Engagement Prediction Panel Component
import React from 'react'
import { useEngagementContext } from '@/context/EngagementContext'

export function PredictionPanel() {
  const { metrics, predictions, insights, loading, error } = useEngagementContext()

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="text-sm text-slate-500">Loading predictions...</div>
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

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Engagement Predictions</h3>
        {metrics && (
          <div className="text-sm px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            Current: {metrics.currentEngagement}%
          </div>
        )}
      </div>

      {/* Current vs Predicted */}
      {metrics && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500">Current Engagement</div>
            <div className="text-sm font-medium text-slate-700">{metrics.currentEngagement}%</div>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div 
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${metrics.currentEngagement}%` }}
            />
          </div>
          {metrics.predictedEngagement && (
            <>
              <div className="flex items-center justify-between mt-2 mb-1">
                <div className="text-xs text-slate-500">Predicted Engagement</div>
                <div className="text-sm font-medium text-emerald-600">{metrics.predictedEngagement}%</div>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div 
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${metrics.predictedEngagement}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Predictions by Timeframe */}
      <div className="grid gap-3 mb-4">
        {predictions.daily && (
          <div className="p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-700">Daily Prediction</div>
              <div className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {Math.round(predictions.daily.confidence * 100)}% confidence
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-1">
              Predicted: {predictions.daily.predictedValue}%
            </div>
            <div className="text-xs text-slate-500">{predictions.daily.recommendation}</div>
          </div>
        )}

        {predictions.weekly && (
          <div className="p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-700">Weekly Prediction</div>
              <div className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                {Math.round(predictions.weekly.confidence * 100)}% confidence
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-1">
              Predicted: {predictions.weekly.predictedValue}%
            </div>
            <div className="text-xs text-slate-500">{predictions.weekly.recommendation}</div>
          </div>
        )}

        {predictions.monthly && (
          <div className="p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-slate-700">Monthly Prediction</div>
              <div className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700">
                {Math.round(predictions.monthly.confidence * 100)}% confidence
              </div>
            </div>
            <div className="text-sm text-slate-600 mb-1">
              Predicted: {predictions.monthly.predictedValue}%
            </div>
            <div className="text-xs text-slate-500">{predictions.monthly.recommendation}</div>
          </div>
        )}
      </div>

      {/* Engagement Factors */}
      {metrics && metrics.factors.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-2">Key Factors</div>
          <div className="grid gap-2">
            {metrics.factors.slice(0, 3).map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{factor.factor}</span>
                <span className={`font-medium ${
                  factor.impact > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Insights</div>
          <ul className="text-xs text-slate-600 space-y-1">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

