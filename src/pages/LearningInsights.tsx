// Learning Insights Page - Personalized Recommendations for Parents
import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { useParentRecommendations } from '../hooks/useParentRecommendations'
import { useOptimalStudyTime } from '../hooks/useOptimalStudyTime'
import { ParentRecommendationsCard } from '../components/ui/ParentRecommendationsCard'
import { OptimalStudyTimeCard } from '../components/ui/OptimalStudyTimeCard'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { getStudentDisplayName } from '../utils/nameUtils'
import { useGradeMode } from '../context/GradeModeContext'
import { CommunicationGuidance, getCommunicationTips } from '../components/ui/CommunicationGuidance'

interface LearningInsightsProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

export default function LearningInsights({ selectedStudentId: propSelectedStudentId, t, locale }: LearningInsightsProps) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(propSelectedStudentId || null)

  // Update selected student when prop changes
  React.useEffect(() => {
    if (propSelectedStudentId) {
      setSelectedStudentId(propSelectedStudentId)
    }
  }, [propSelectedStudentId])

  // Select first student when students are loaded
  React.useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0]._id)
    }
  }, [students, selectedStudentId])

  // Get recommendations for selected student (pass locale for Arabic generation)
  const { recommendations, loading, error, refresh } = useParentRecommendations(selectedStudentId || undefined, locale)
  const { insights: studyTimeInsights, loading: studyTimeLoading } = useOptimalStudyTime(selectedStudentId || undefined, locale)
  const selectedStudent = students?.find(s => s._id === selectedStudentId) || students?.[0]
  
  // Get grade mode configuration
  const gradeLevel = selectedStudent?.gradeLevel || 5
  const { config: gradeConfig } = useGradeMode(selectedStudent?._id, gradeLevel)
  
  // Filter recommendations based on grade mode
  // For early primary, show only simple, encouraging recommendations
  const filteredRecommendations = React.useMemo(() => {
    if (!recommendations) return []
    
    if (gradeConfig.mode === 'early-primary') {
      // Only show encouragement and simple monitoring for early primary
      return recommendations.filter(rec => 
        rec.type === 'encouragement' || rec.type === 'monitoring'
      )
    }
    
    return recommendations
  }, [recommendations, gradeConfig.mode])
  
  // Check if there are concerns that need communication guidance
  const hasConcerns = React.useMemo(() => {
    if (!recommendations) return false
    return recommendations.some(rec => 
      rec.type === 'intervention' || 
      rec.priority === 'high' ||
      (rec.type === 'subject_focus' && rec.priority === 'high')
    )
  }, [recommendations])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={t('learningInsights')}
          subtitle={t('learningInsightsSubtitle')}
          icon="💡"
        />

        {/* Student Selector (if multiple children) */}
        {students && students.length > 1 && (
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">{t('selectChild')}</label>
              <select
                className="h-10 rounded-lg bg-white border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {getStudentDisplayName(student, locale)}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
                <span className="text-2xl">💡</span>
              </div>
              <p className="text-slate-600">{t('analyzingPerformance')}</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card>
            <div className="text-center py-12">
              <EmptyState
                icon="⚠️"
                title={t('errorLoadingRecommendations')}
                message={error}
              />
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          </Card>
        )}

        {/* Recommendations */}
        {!loading && !error && (
          <div className="grid gap-6">
            {/* Grade Mode Indicator (optional - for transparency) */}
            {gradeConfig.isManualOverride && (
              <Card className="bg-blue-50 border-blue-200">
                <div className="p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Mode:</strong> {gradeConfig.label} (Manually Overridden)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Dashboard is customized for this mode. You can change it in Settings.
                  </p>
                </div>
              </Card>
            )}
            
            {/* Communication Guidance - only for middle/senior school with concerns */}
            {gradeConfig.features.showCommunicationTips && hasConcerns && (
              <CommunicationGuidance
                concern="Supporting your child with academic challenges"
                tips={getCommunicationTips('low-performance')}
              />
            )}
            
            {/* Parent Recommendations */}
            <ParentRecommendationsCard
              recommendations={filteredRecommendations}
              loading={loading}
              studentName={selectedStudent?.name}
              studentId={selectedStudentId || undefined}
              t={t}
              locale={locale}
            />

            {/* Optimal Study Time Insights - only for middle/senior school or if enabled */}
            {gradeConfig.features.showDetailedAnalytics && (
              <OptimalStudyTimeCard
                insights={studyTimeInsights}
                loading={studyTimeLoading}
                studentName={selectedStudent?.name}
                t={t}
                locale={locale}
              />
            )}

            {/* Additional Info Card */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{t('aboutLearningInsights')}</h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    {t('aiRecommendationSystem')}
                  </p>
                  <p>
                    {t('recommendationsUpdated')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t('recentGradeTrends')}</li>
                    <li>{t('assignmentCompletionPatterns')}</li>
                    <li>{t('subjectStrengthsWeaknesses')}</li>
                    <li>{t('studyConsistency')}</li>
                  </ul>
                  <p className="pt-2">
                    <strong>{t('tip')}:</strong> {t('tipReviewRecommendations')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

