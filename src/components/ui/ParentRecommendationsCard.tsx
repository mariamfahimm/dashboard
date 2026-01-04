// Parent Recommendations Card Component
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { AIExplainabilityTooltip } from './AIExplainabilityTooltip'
import { ActionChecklist } from './ActionChecklist'
import type { ParentRecommendation } from '../../services/api/parentRecommendationApi'
import { useRecommendationTracking } from '../../hooks/useRecommendationTracking'

interface ParentRecommendationsCardProps {
  recommendations: ParentRecommendation[]
  loading?: boolean
  studentName?: string
  studentId?: string
  t?: (key: string) => string
  locale?: string
}

export function ParentRecommendationsCard({ 
  recommendations, 
  loading = false,
  studentName,
  studentId,
  t = (key: string) => key,
  locale = 'en'
}: ParentRecommendationsCardProps) {
  const { markAsCompleted, getTrackingStatus, tracking } = useRecommendationTracking(studentId)
  
  // Use tracking state to force re-renders when it changes
  React.useEffect(() => {
    // This effect will run whenever tracking changes, causing a re-render
  }, [tracking])
  
  // Force re-render when tracking changes by using a state that depends on it
  const [, forceUpdate] = React.useState(0)
  React.useEffect(() => {
    // This will cause a re-render when tracking changes
    forceUpdate(prev => prev + 1)
  }, [getTrackingStatus])
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

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-slate-500">{t('noRecommendationsAvailable')}</p>
          <p className="text-sm text-slate-400 mt-2">{t('recommendationsWillAppear')}</p>
        </div>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study_schedule':
        return '📅'
      case 'subject_focus':
        return '📚'
      case 'resource':
        return '📖'
      case 'intervention':
        return '⚠️'
      case 'encouragement':
        return '🎉'
      case 'monitoring':
        return '👀'
      default:
        return '💡'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study_schedule':
        return t('studySchedule')
      case 'subject_focus':
        return t('subjectFocus')
      case 'resource':
        return t('resources')
      case 'intervention':
        return t('intervention')
      case 'encouragement':
        return t('encouragement')
      case 'monitoring':
        return t('monitoring')
      default:
        return t('general')
    }
  }

  // Filter out completed recommendations
  const activeRecommendations = recommendations.filter(rec => {
    const tracking = getTrackingStatus(rec)
    return !tracking.completed
  })

  // Group by priority (only active recommendations)
  const highPriority = activeRecommendations.filter(r => r.priority === 'high')
  const mediumPriority = activeRecommendations.filter(r => r.priority === 'medium')
  const lowPriority = activeRecommendations.filter(r => r.priority === 'low')
  
  // Count completed recommendations
  const completedCount = recommendations.length - activeRecommendations.length

  return (
    <Card>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💡</span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('personalizedRecommendations')}</h3>
            <p className="text-sm text-slate-500">
              {studentName ? `${t('for')} ${studentName}` : t('actionableAdviceToSupportChild')}
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          {activeRecommendations.length} {activeRecommendations.length !== 1 ? t('activeRecommendations') : t('activeRecommendation')}
          {completedCount > 0 && (
            <span className="text-slate-400"> • {completedCount} {t('completed')}</span>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {/* High Priority */}
        {highPriority.map((rec, idx) => {
          const tracking = getTrackingStatus(rec)
          const isCompleted = tracking.completed
          
          return (
            <div
              key={idx}
              className={`border-2 rounded-xl p-4 transition-all ${getPriorityColor(rec.priority)} ${isCompleted ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* Checkbox */}
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => {
                        console.log('Checkbox clicked:', { title: rec.title, checked: e.target.checked })
                        markAsCompleted(rec, e.target.checked)
                      }}
                      className="w-5 h-5 rounded border-2 border-slate-300 text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-900">
                      {isCompleted ? t('done') : t('markAsDone')}
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500">
                    {Math.round(rec.confidence * 100)}% {t('confidence')}
                  </div>
                  <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-semibold text-slate-900 ${isCompleted ? 'line-through' : ''}`}>{rec.title}</h4>
                <Badge variant={rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'} size="sm">
                  {rec.priority.toUpperCase()}
                </Badge>
                <AIExplainabilityTooltip
                  dataSources={[
                    `Grade history for ${rec.relatedSubject || 'all subjects'}`,
                    'Assignment completion patterns',
                    'Performance trends over time'
                  ]}
                  timeRange="Last 6-8 weeks"
                  confidence={rec.confidence}
                  changeFactors={[
                    'Recent grade improvements',
                    'Changes in study patterns',
                    'New assignments or assessments'
                  ]}
                >
                  <span className="text-xs text-slate-400">(Parent-only insight)</span>
                </AIExplainabilityTooltip>
              </div>
              <p className="text-xs text-slate-600 mb-2">{getTypeLabel(rec.type)}</p>

            <p className={`text-sm text-slate-700 mb-3 ${isCompleted ? 'line-through opacity-60' : ''}`}>{rec.description}</p>

            {/* Action Checklist - interactive checklist for tracking actions */}
            {!isCompleted && studentId && rec.actionItems.length > 0 && (
              <div className="mb-3">
                <ActionChecklist
                  recommendationId={`${rec.type}-${rec.priority}-${idx}-${selectedStudentId || ''}`}
                  title={t('whatYouCanDo') || 'Action Items'}
                  actionItems={rec.actionItems.map((item, actionIdx) => ({
                    id: `action-${idx}-${actionIdx}`,
                    text: item
                  }))}
                />
              </div>
            )}

            {/* Expected Impact & Timeframe */}
            <div className={`grid grid-cols-2 gap-2 text-xs ${isCompleted ? 'opacity-60' : ''}`}>
              <div className="bg-white/50 rounded p-2">
                <p className="font-semibold text-slate-700 mb-0.5">{t('expectedImpact')}</p>
                <p className="text-slate-600">{rec.expectedImpact}</p>
              </div>
              <div className="bg-white/50 rounded p-2">
                <p className="font-semibold text-slate-700 mb-0.5">{t('timeframe')}</p>
                <p className="text-slate-600">{rec.timeframe}</p>
              </div>
            </div>
            
            {/* Completion indicator */}
            {isCompleted && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <span>✓</span>
                  <span className="font-medium">{t('markedAsCompleted')}</span>
                </div>
              </div>
            )}
          </div>
        )
        })}

        {/* Medium Priority */}
        {mediumPriority.map((rec, idx) => {
          const tracking = getTrackingStatus(rec)
          const isCompleted = tracking.completed
          
          return (
            <div
              key={`medium-${idx}`}
              className={`border rounded-xl p-4 transition-all ${getPriorityColor(rec.priority)} ${isCompleted ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* Checkbox */}
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => markAsCompleted(rec, e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-slate-300 text-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 cursor-pointer transition-all"
                    />
                    <span className="ml-2 text-xs text-slate-600 group-hover:text-slate-900">
                      {t('done')}
                    </span>
                  </label>
                </div>
                <span className="text-xl">{getTypeIcon(rec.type)}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h4 className={`font-semibold text-slate-900 ${isCompleted ? 'line-through' : ''}`}>{rec.title}</h4>
                <Badge variant="warning" size="sm">MEDIUM</Badge>
              </div>

              <p className={`text-sm text-slate-700 mb-2 ${isCompleted ? 'line-through opacity-60' : ''}`}>{rec.description}</p>

              <div className={`mb-2 ${isCompleted ? 'opacity-60' : ''}`}>
                <p className="text-xs font-semibold text-slate-700 mb-1">{t('actions')}:</p>
                <ul className="space-y-0.5">
                  {rec.actionItems.slice(0, 3).map((action, actionIdx) => (
                    <li key={actionIdx} className={`flex items-start gap-2 text-xs text-slate-700 ${isCompleted ? 'line-through' : ''}`}>
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Completion indicator */}
              {isCompleted && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <span>✓</span>
                    <span>{t('completed')}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Low Priority */}
        {lowPriority.length > 0 && (
          <details className="border rounded-xl p-4">
            <summary className="cursor-pointer font-semibold text-slate-700 flex items-center gap-2">
              <span>💡</span>
              <span>{t('additionalRecommendations')} ({lowPriority.length})</span>
            </summary>
            <div className="mt-3 space-y-2">
              {lowPriority.map((rec, idx) => {
                const tracking = getTrackingStatus(rec)
                const isCompleted = tracking.completed
                
                return (
                  <div key={`low-${idx}`} className={`border-l-2 border-blue-200 pl-3 ${isCompleted ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) => markAsCompleted(rec, e.target.checked)}
                          className="w-3 h-3 rounded border border-slate-300 text-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        />
                      </label>
                      <h5 className={`font-medium text-sm text-slate-900 ${isCompleted ? 'line-through' : ''}`}>{rec.title}</h5>
                    </div>
                    <p className={`text-xs text-slate-600 mb-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>{rec.description}</p>
                    <ul className={`text-xs text-slate-600 space-y-0.5 ${isCompleted ? 'opacity-60' : ''}`}>
                      {rec.actionItems.slice(0, 2).map((action, actionIdx) => (
                        <li key={actionIdx} className={`flex items-start gap-1 ${isCompleted ? 'line-through' : ''}`}>
                          <span>•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </div>
    </Card>
  )
}

