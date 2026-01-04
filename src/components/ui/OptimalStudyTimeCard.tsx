// Optimal Study Time Insights Card
// Displays performance-based suggestions for optimal study times
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { AIExplainabilityTooltip } from './AIExplainabilityTooltip'
import type { OptimalStudyTimeInsight } from '../../services/api/optimalStudyTimeApi'

interface OptimalStudyTimeCardProps {
  insights: OptimalStudyTimeInsight | null
  loading?: boolean
  studentName?: string
  t?: (key: string) => string
  locale?: string
}

export function OptimalStudyTimeCard({ insights, loading = false, studentName, t = (key: string) => key, locale = 'en' }: OptimalStudyTimeCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!insights) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-slate-500">{t('noStudyTimeInsights')}</p>
        </div>
      </Card>
    )
  }

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'low':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-orange-600'
  }

  return (
    <Card>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⏰</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{t('performanceInsights')}</h3>
              <AIExplainabilityTooltip
                dataSources={[
                  'Submission timestamps from past assignments',
                  'Performance scores by time of day',
                  'Day-of-week patterns',
                  'Subject-specific submission patterns'
                ]}
                timeRange={`Last ${insights.bestTimeWindow?.submissionCount || 20} submissions`}
                confidence={insights.dataQuality === 'high' ? 0.8 : insights.dataQuality === 'medium' ? 0.6 : 0.4}
                changeFactors={[
                  'More submission data will improve accuracy',
                  'Changes in study schedule',
                  'Seasonal patterns (exam periods, holidays)'
                ]}
              >
                <span className="text-xs text-slate-400">(Parent-only insight)</span>
              </AIExplainabilityTooltip>
            </div>
            <p className="text-sm text-slate-500">
              {t('suggestedOptimalStudyTimes')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="info" size="sm">
            {t('basedOnPastSubmissions')}
          </Badge>
          <Badge variant={insights.dataQuality === 'high' ? 'success' : insights.dataQuality === 'medium' ? 'warning' : 'default'} size="sm">
            {insights.dataQuality === 'high' ? t('highConfidence') : insights.dataQuality === 'medium' ? t('moderateConfidence') : t('limitedData')}
          </Badge>
        </div>
      </div>

      {/* Best Time Window */}
      {insights.bestTimeWindow && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">{t('suggestedBestTime')}</p>
              <p className="text-lg font-bold text-slate-900">{insights.bestTimeWindow.label}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getScoreColor(insights.bestTimeWindow.averageScore)}`}>
                {insights.bestTimeWindow.averageScore}%
              </p>
              <p className="text-xs text-slate-500">{t('averageScore')}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {t('basedOnPastSubmissionsCount')?.replace('{count}', insights.bestTimeWindow.submissionCount.toString()) || `Based on ${insights.bestTimeWindow.submissionCount} past submission${insights.bestTimeWindow.submissionCount !== 1 ? 's' : ''} during this time period.`}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>{t('suggestions')}</span>
          </h4>
          <div className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-slate-700 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Windows Breakdown */}
      {insights.timeWindows.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('performanceByTimeOfDay')}</h4>
          <div className="space-y-2">
            {insights.timeWindows.slice(0, 4).map((window, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{window.label}</p>
                  <p className="text-xs text-slate-500">
                    {window.submissionCount} {window.submissionCount !== 1 ? t('submissions') : t('submission')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getScoreColor(window.averageScore)}`}>
                    {window.averageScore}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject-Specific Insights */}
      {insights.subjectSpecificInsights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('subjectSpecificPatterns')}</h4>
          <div className="space-y-3">
            {insights.subjectSpecificInsights
              .filter(s => s.bestTimeWindow && s.bestTimeWindow.submissionCount >= 2)
              .slice(0, 3)
              .map((subject, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900">{subject.subject}</p>
                    <p className={`text-sm font-bold ${getScoreColor(subject.averageScore)}`}>
                      {subject.averageScore}% {t('avg')}
                    </p>
                  </div>
                  {subject.bestTimeWindow && (
                    <p className="text-xs text-slate-600">
                      {t('pastWorkSubmittedDuring')} <span className="font-semibold">{subject.bestTimeWindow.label.toLowerCase()}</span> {t('tendedToScoreHigher')}.
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Day of Week Patterns */}
      {insights.dayOfWeekPatterns.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('dayOfWeekPatterns')}</h4>
          <div className="grid grid-cols-2 gap-2">
            {insights.dayOfWeekPatterns.slice(0, 4).map((day, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded-lg text-center">
                <p className="text-xs font-medium text-slate-900">{day.day.slice(0, 3)}</p>
                <p className={`text-sm font-bold ${getScoreColor(day.averageScore)}`}>
                  {day.averageScore}%
                </p>
                <p className="text-xs text-slate-500">{day.submissionCount} {t('submissions')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer Note */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          {insights.note}
        </p>
      </div>
    </Card>
  )
}

