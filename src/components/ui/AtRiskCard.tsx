// At-Risk Student Detection Card Component
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import type { AtRiskPrediction } from '../../services/api/atRiskApi'

interface AtRiskCardProps {
  prediction: AtRiskPrediction | null
  loading?: boolean
}

export function AtRiskCard({ prediction, loading = false }: AtRiskCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </Card>
    )
  }

  if (!prediction) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-slate-500">No risk data available</p>
        </div>
      </Card>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '⚡'
      case 'low':
        return '✅'
      default:
        return '📊'
    }
  }

  return (
    <Card className="border-2" style={{
      borderColor: prediction.riskLevel === 'critical' ? '#ef4444' :
                   prediction.riskLevel === 'high' ? '#f97316' :
                   prediction.riskLevel === 'medium' ? '#eab308' :
                   '#22c55e'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getRiskIcon(prediction.riskLevel)}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Early Warning System</h3>
            <p className="text-sm text-slate-500">At-Risk Student Detection</p>
          </div>
        </div>
        <Badge
          variant={prediction.riskLevel === 'critical' ? 'danger' :
                  prediction.riskLevel === 'high' ? 'warning' :
                  prediction.riskLevel === 'medium' ? 'warning' :
                  'success'}
          size="lg"
        >
          {prediction.riskLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Risk Score</span>
          <span className="text-2xl font-bold text-slate-900">{prediction.riskScore}/100</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getRiskColor(prediction.riskLevel)}`}
            style={{ width: `${prediction.riskScore}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
          <span>Low Risk</span>
          <span>Critical Risk</span>
        </div>
      </div>

      {/* Probability & Confidence */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-1">Failure Probability</div>
          <div className="text-xl font-bold text-slate-900">
            {Math.round(prediction.probability * 100)}%
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-1">Confidence</div>
          <div className="text-xl font-bold text-slate-900">
            {Math.round(prediction.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {prediction.factors.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Contributing Factors</h4>
          <div className="space-y-1">
            {prediction.factors.map((factor, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-red-500">•</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {prediction.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommended Actions</h4>
          <div className="space-y-2">
            {prediction.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Timeline:</span>
          <span className="font-medium text-slate-900">{prediction.timeline}</span>
        </div>
      </div>
    </Card>
  )
}

