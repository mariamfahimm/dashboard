import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { usePerformance } from '../hooks/usePerformance'
import { useEngagement } from '../hooks/useEngagement'
import { useGrades } from '../hooks/useGrades'
import { useCourses } from '../hooks/useCourses'
import { useForecast } from '../hooks/useForecast'
import { useGoals } from '../hooks/useGoals'
import { useRealtime } from '../services/realtimeService'
import { useAtRisk } from '../hooks/useAtRisk'
import { AtRiskCard } from '../components/ui/AtRiskCard'
import { EmptyState } from '../components/EmptyState'
import { getStudentDisplayName } from '../utils/nameUtils'
import { useGradeMode } from '../context/GradeModeContext'
import { useUserAdaptive } from '../context/UserAdaptiveContext'
import { getSimpleProgressPhrase, formatPercentage, type GradeMode } from '../utils/gradeModeUtils'
import { AIExplainabilityTooltip } from '../components/ui/AIExplainabilityTooltip'
import { CommunicationGuidance, getCommunicationTips } from '../components/ui/CommunicationGuidance'
import { AdaptiveDashboardBanner } from '../components/ui/AdaptiveDashboardBanner'
import { FeatureVisibilityBadge } from '../components/ui/FeatureVisibilityBadge'
import { ExpandableAdvancedSection } from '../components/ui/ExpandableAdvancedSection'
import { DashboardOnboarding } from '../components/ui/DashboardOnboarding'
import { evaluationLogger } from '../utils/evaluationLogger'

// Types
type WeeklyPoint = { week: string; value: number }
type SubjectProgress = { subject: string; percent: number; color: string; trend: WeeklyPoint[]; delta?: number; avg?: number }
type ChildProfile = { id: string; name: string }

// Small chart util
function Sparkline({ points, stroke = '#5C7CF7' }: { points: WeeklyPoint[]; stroke?: string }) {
  const width = 240
  const height = 64
  const max = Math.max(...points.map(p => p.value))
  const min = Math.min(...points.map(p => p.value))
  const normalize = (v: number) => (1 - (v - min) / (max - min || 1)) * (height - 10) + 5
  const step = width / (points.length - 1)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${normalize(p.value)}`).join(' ')
  // expose t to simple child components via window to avoid prop-drilling
  ;(window as any).__t = t
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16">
      <path d={d} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
      <line x1="0" y1={height - 2} x2={width} y2={height - 2} stroke="#e2e8f0" strokeWidth={2} />
    </svg>
  )
}

// Components
function SubjectBar({ s, t, showPercentages, useSimpleLanguage, gradeMode }: { s: SubjectProgress; t: (k:string)=>string; showPercentages: boolean; useSimpleLanguage: boolean; gradeMode: GradeMode }) {
  const displayValue = useSimpleLanguage 
    ? getSimpleProgressPhrase(s.percent)
    : showPercentages 
      ? formatPercentage(s.percent, gradeMode)
      : getSimpleProgressPhrase(s.percent)

  return (
    <div className="rounded-2xl bg-white shadow-soft p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">{s.subject}</div>
        <div className={`text-sm font-semibold ${useSimpleLanguage ? 'text-slate-900' : 'text-slate-700'}`}>
          {displayValue}
        </div>
      </div>
      <div className="mt-2 h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${s.color}`} style={{ width: `${s.percent}%` }} />
      </div>
      {!useSimpleLanguage && (
        <>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${s.delta && s.delta>0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.delta && s.delta>0 ? `📈 ${t('improvingTag')}` : `⚖️ ${t('stableTag')}`}</span>
            {typeof s.avg === 'number' && <span className="text-slate-500">+{Math.max(0, (s.percent - (s.avg||0))).toFixed(0)}% {t('vsClass')}</span>}
          </div>
          <div className="mt-3"><Sparkline points={s.trend} /></div>
        </>
      )}
    </div>
  )
}

function ComparisonCard({ childAvg, classAvg, t, showPercentages = true, useSimpleLanguage = false, gradeMode }: { childAvg: number; classAvg: number; t: (k:string)=>string; showPercentages?: boolean; useSimpleLanguage?: boolean; gradeMode: GradeMode }) {
  const delta = childAvg - classAvg
  const positive = delta >= 0
  const message = positive ? t('aheadOfCurve') : t('catchingUp')
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 grid place-items-center rounded-lg ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{positive ? '⬆' : '↗'}</div>
        <div className="font-semibold text-slate-800">{message}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500">{t('yourAverage')}</div>
          <div className="text-2xl font-bold text-slate-800">
            {useSimpleLanguage ? getSimpleProgressPhrase(childAvg) : showPercentages ? formatPercentage(childAvg, gradeMode) : getSimpleProgressPhrase(childAvg)}
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${childAvg}%` }} /></div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{t('classAverage')}</div>
          <div className="text-2xl font-bold text-slate-800">
            {useSimpleLanguage ? getSimpleProgressPhrase(classAvg) : showPercentages ? formatPercentage(classAvg, gradeMode) : getSimpleProgressPhrase(classAvg)}
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-400" style={{ width: `${classAvg}%` }} /></div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">{t('keepUpMomentum')}</div>
    </div>
  )
}

type Goal = { key: string; label: string; unit: string; target: number; current: number; color: string }

// Goals will be translated dynamically based on locale
const getInitialGoals = (t: (k:string)=>string): Goal[] => [
  { key: 'grades', label: t('grade'), unit: '%', target: 85, current: 78, color: 'bg-violet-500' },
  { key: 'time', label: t('weeklyStudyTime'), unit: t('hrs'), target: 6, current: 4, color: 'bg-emerald-500' },
  { key: 'completion', label: t('completionRate'), unit: '%', target: 90, current: 72, color: 'bg-amber-500' }
]

function GoalsCard({ goals: goalsData, forecasts, loading, studentId, t }: { goals?: any[]; forecasts: any[]; loading: boolean; studentId?: string; t: (k:string)=>string }) {
  const [goals, setGoals] = React.useState<Goal[]>(() => getInitialGoals(t))
  const [showEncourage, setShowEncourage] = React.useState<null | string>(null)
  
  // Get initial goals for color reference
  const initialGoals = React.useMemo(() => getInitialGoals(t), [t])
  
  // Update goals from Goals API (preferred) or fallback to forecasts
  React.useEffect(() => {
    if (goalsData && goalsData.length > 0) {
      // Use Goals API data
      const updatedGoals = goalsData.map(goal => {
        const goalKey = goal.type === 'grade' ? 'grades' : 
                        goal.type === 'time' ? 'time' : 'completion'
        const existingGoal = initialGoals.find(g => g.key === goalKey)
        return {
          key: goalKey,
          label: goal.name,
          unit: goal.unit,
          target: goal.target,
          current: goal.current,
          color: existingGoal?.color || 'bg-brand-500',
          prediction: goal.prediction // Include prediction data
        }
      })
      setGoals(updatedGoals)
    } else if (forecasts && forecasts.length > 0) {
      // Fallback to forecasts if Goals API data not available
      const updatedGoals = forecasts.map(f => {
        const goalKey = f.goalId.includes('grade') ? 'grades' : 
                        f.goalId.includes('time') ? 'time' : 'completion'
        const existingGoal = initialGoals.find(g => g.key === goalKey)
        return {
          key: goalKey,
          label: f.goalName,
          unit: f.unit,
          target: f.target,
          current: f.current,
          color: existingGoal?.color || 'bg-brand-500'
        }
      })
      setGoals(updatedGoals)
    }
  }, [goalsData, forecasts, initialGoals])
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-3">{t('goals')}</div>
      <div className="grid gap-4">
        {goals.map(g => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100))
          return (
            <div key={g.key} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium text-slate-700">{g.label}</div>
                <div className="text-slate-500">{g.current}{g.unit} / {g.target}{g.unit}</div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${g.color}`} style={{ width: `${pct}%` }} />
              </div>
              {/* Show prediction if available */}
              {forecasts.length > 0 && (() => {
                const forecast = forecasts.find(f => 
                  (f.goalId.includes('grade') && g.key === 'grades') ||
                  (f.goalId.includes('time') && g.key === 'time') ||
                  (f.goalId.includes('completion') && g.key === 'completion')
                )
                if (forecast) {
                  const isOnTrack = forecast.onTrack
                  const predictedDate = forecast.predictedCompletion 
                    ? new Date(forecast.predictedCompletion).toLocaleDateString()
                    : null
                  
                  return (
                    <div className="mt-2 text-xs">
                      {isOnTrack ? (
                        <div className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                          ✅ On track{predictedDate ? ` - Target: ${predictedDate}` : ''}
                        </div>
                      ) : (
                        <div className="text-amber-700 bg-amber-50 px-2 py-1 rounded">
                          ⚠️ May need support - {forecast.forecast?.message || 'Review progress'}
                        </div>
                      )}
                      <div className="text-slate-500 mt-1">
                        {t('confidence')}: {Math.round(forecast.confidence * 100)}%
                      </div>
                    </div>
                  )
                }
                return null
              })()}
              <div className="mt-2 flex justify-end">
                <button className="text-xs px-3 py-1 rounded-lg bg-brand-500 text-white" onClick={()=>setShowEncourage(g.label)}>{t('encourage')}</button>
              </div>
            </div>
          )
        })}
      </div>
      {showEncourage && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowEncourage(null)} />
          <div className="relative bg-white rounded-2xl shadow-soft p-5 w-[min(92vw,480px)]">
            <div className="font-semibold">{t('sendEncouragement')}</div>
            <p className="text-sm text-slate-500 mt-1">"{t('sampleEncouragement')}"</p>
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1 rounded-lg bg-slate-100" onClick={()=>setShowEncourage(null)}>{t('cancel')}</button>
              <button className="px-3 py-1 rounded-lg bg-brand-500 text-white" onClick={()=>setShowEncourage(null)}>{t('send')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MomentumGauge({ value, t }: { value: number; t: (k:string)=>string }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = Math.round((value / 100) * circumference)
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5 flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
          <circle cx="60" cy="60" r={radius} stroke="#5C7CF7" strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
          <text x="60" y="66" textAnchor="middle" className="fill-slate-800 font-bold text-xl">{value}</text>
        </svg>
      </div>
      <div className="mt-2 text-sm font-medium text-slate-700">{t('momentumPrefix')}: {value} — {t('trendingUpward')}!</div>
      <div className="text-xs text-slate-500">{t('buildingStrongHabits')}</div>
    </div>
  )
}

function GrowthInsightsCard({ insights, t, insightLength, useSimpleLanguage = false }: { insights: any[]; t: (k:string)=>string; insightLength: 'sentence' | 'paragraph' | 'full'; useSimpleLanguage?: boolean }) {
  // Group insights by type
  const improving = insights.filter(i => i.type === 'strength' || i.type === 'opportunity')
  const needsAttention = insights.filter(i => i.type === 'weakness')
  
  // Simplify messages for early primary - remove percentages and technical terms
  const simplifyMessage = (message: string): string => {
    if (!useSimpleLanguage) return message
    
    // Remove percentages like "3.7%" or "91.5%"
    let simplified = message.replace(/\d+\.?\d*%/g, '')
    
    // Simplify technical language
    simplified = simplified.replace(/declined by/gi, 'needs more practice in')
    simplified = simplified.replace(/Additional practice and support may be beneficial/gi, 'Keep encouraging them!')
    simplified = simplified.replace(/performing well with a score of/gi, 'is doing well in')
    simplified = simplified.replace(/Keep up the excellent work!/gi, 'Great job!')
    simplified = simplified.replace(/is performing well/gi, 'is doing great')
    
    // Clean up extra spaces
    simplified = simplified.replace(/\s+/g, ' ').trim()
    
    // Remove trailing periods if message ends with encouragement
    if (simplified.endsWith('.') && (simplified.includes('Great') || simplified.includes('encouraging'))) {
      simplified = simplified.slice(0, -1)
    }
    
    return simplified || message
  }
  
  // Create summary from insights based on length preference
  const getSummary = () => {
    if (insights.length === 0) {
      return useSimpleLanguage 
        ? 'Your child is learning and growing every day!'
        : 'Performance data is being analyzed. Insights will appear here as more data becomes available.'
    }
    
    if (insightLength === 'sentence') {
      // Single sentence summary - simplified for early primary
      const firstInsight = insights[0]
      if (useSimpleLanguage && firstInsight) {
        // Extract just the encouraging part for early primary
        if (firstInsight.type === 'strength') {
          return `${firstInsight.subject} is going well! Keep up the great work!`
        } else if (firstInsight.type === 'weakness') {
          return `${firstInsight.subject} needs a bit more practice. Keep encouraging them!`
        } else {
          return `${firstInsight.subject} is making progress!`
        }
      }
      return simplifyMessage(firstInsight?.message || insights.slice(0, 1).map(i => i.message).join(' '))
    } else if (insightLength === 'paragraph') {
      // First 2-3 insights as paragraph
      return insights.slice(0, 3).map(i => simplifyMessage(i.message)).join(' ')
    } else {
      // Full details
      return insights.map(i => simplifyMessage(i.message)).join(' ')
    }
  }

  const summary = getSummary()

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-2">{t('growthInsights')}</div>
      <p className="text-sm text-slate-700 leading-relaxed mb-3">{summary}</p>
      
      {/* Insight Cards - Only show for paragraph/full length, not for sentence (Early Primary) */}
      {insights.length > 0 && insightLength !== 'sentence' && (
        <div className="grid gap-2 mb-3">
          {insights.slice(0, 3).map((insight, idx) => {
            const bgColor = insight.type === 'strength' ? 'bg-emerald-50 border-emerald-200' :
                           insight.type === 'weakness' ? 'bg-rose-50 border-rose-200' :
                           'bg-amber-50 border-amber-200'
            const textColor = insight.type === 'strength' ? 'text-emerald-700' :
                             insight.type === 'weakness' ? 'text-rose-700' :
                             'text-amber-700'
            const icon = insight.type === 'strength' ? '✅' :
                        insight.type === 'weakness' ? '⚠️' : '💡'
            
            return (
              <div key={idx} className={`p-3 rounded-lg border ${bgColor} ${textColor} text-xs`}>
                <div className="font-medium mb-1">{icon} {insight.subject}: {simplifyMessage(insight.message)}</div>
                {!useSimpleLanguage && (
                  <div className="text-xs opacity-75">{t('confidence')}: {Math.round(insight.confidence * 100)}%</div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {improving.length > 0 && (
          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
            {t('improvingTag')} ({improving.length})
          </span>
        )}
        {needsAttention.length > 0 && (
          <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700">
            {t('needsAttentionTag')} ({needsAttention.length})
          </span>
        )}
        {insights.length === 0 && (
          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{t('stableTag')}</span>
        )}
      </div>
    </div>
  )
}

function SubjectHeatmap({ subjects, t, locale, maxColors = 5, showPercentages = true, gradeMode }: { subjects: SubjectProgress[]; t: (k:string)=>string; locale: string; maxColors?: number | 'full'; showPercentages?: boolean; gradeMode: GradeMode }) {
  const translateSubject = (name: string) => {
    const map: Record<string, string> = {
      'Math': t('subjectMath'),
      'Science': t('subjectScience'),
      'English': t('subjectEnglish'),
      'Biology': t('subjectBiology'),
      'Chemistry': t('subjectChemistry'),
      'Physics': t('subjectPhysics'),
      'History': t('subjectHistory'),
      'EVS': t('subjectEVS'),
      'Social': t('subjectSocial'),
      'CS': t('subjectCS')
    }
    return map[name] || name
  }
  // Adjust band logic based on maxColors
  const getBand = (p: number) => {
    if (maxColors === 3) {
      // Simple 3-color system: Green, Yellow, Red
      return p >= 80 ? t('bandStrong') : p >= 60 ? t('bandGrowing') : t('bandEmerging')
    } else if (maxColors === 5) {
      // 5-color system with more granularity
      if (p >= 90) return t('bandStrong')
      if (p >= 80) return t('bandGrowing')
      if (p >= 70) return 'Average'
      if (p >= 60) return t('bandGrowing')
      return t('bandEmerging')
    } else {
      // Full color system
      return p >= 80 ? t('bandStrong') : p >= 65 ? t('bandGrowing') : t('bandEmerging')
    }
  }
  const bandColor = (b: string) => {
    const strongLabel = t('bandStrong')
    const growingLabel = t('bandGrowing')
    return b===strongLabel || b==='Strong' ? 'bg-emerald-50 text-emerald-700' : b===growingLabel || b==='Growing' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
  }
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-3">{t('strengthsFocus')}</div>
      <div className="grid gap-3">
        {subjects.map(s => {
          const band = getBand(s.percent)
          return (
            <div key={s.subject} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 sm:col-span-2 text-sm text-slate-700">{locale === 'ar' ? translateSubject(s.subject) : s.subject}</div>
              <div className="col-span-7 sm:col-span-8 h-3 rounded-full bg-slate-100">
                <div className={`h-3 rounded-full ${s.color}`} style={{ width: `${s.percent}%` }} />
              </div>
              <div className={`col-span-2 sm:col-span-2 justify-self-end text-[11px] px-2 py-1 rounded-full ${bandColor(band)}`}>
                {showPercentages ? `${band} (${formatPercentage(s.percent, gradeMode)})` : band}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrendCharts({ subjects, t }: { subjects: SubjectProgress[]; t: (k:string)=>string }) {
  const width = 420
  const height = 140
  const makePath = (pts: WeeklyPoint[], color: string) => {
    const max = Math.max(...pts.map(p=>p.value))
    const min = Math.min(...pts.map(p=>p.value))
    const step = width / (pts.length-1)
    const norm = (v:number)=> (1-(v-min)/(max-min||1))*(height-20)+10
    return pts.map((p,i)=>`${i?'L':'M'} ${i*step} ${norm(p.value)}`).join(' ')
  }
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-3">{t('weeklyTrends')}</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('scoresBySubject')}</div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
            {subjects.map((s,idx)=> (
              <path key={s.subject} d={makePath(s.trend, '')} fill="none" stroke={[ '#5C7CF7','#10B981','#8B5CF6' ][idx%3]} strokeWidth={3} strokeLinecap="round" />
            ))}
            <line x1="0" y1={height-2} x2={width} y2={height-2} stroke="#e2e8f0" />
          </svg>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('childVsClass')}</div>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
            {subjects.slice(0,1).map((s)=>{
              const classPts = s.trend.map(p=>({ ...p, value: (s.avg || 70) - 2 + (p.value%3) }))
              return (
                <g key={s.subject}>
                  <path d={makePath(classPts,'')} fill="none" stroke="#94a3b8" strokeWidth={3} strokeDasharray="6 6" />
                  <path d={makePath(s.trend,'')} fill="none" stroke="#5C7CF7" strokeWidth={3} />
                </g>
              )
            })}
            <line x1="0" y1={height-2} x2={width} y2={height-2} stroke="#e2e8f0" />
          </svg>
          <div className="text-xs text-slate-500">{t('classAvgShort')}: 75% — {t('yourChild')}: 80%</div>
        </div>
      </div>
    </div>
  )
}

function ForecastWidget({ t, forecasts, loading, error, showExplainability = true }: { t: (k:string)=>string; forecasts: any[]; loading: boolean; error?: string | null; showExplainability?: boolean }) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="font-semibold text-slate-800 mb-2">{t('predictiveForecast')}</div>
        <div className="text-sm text-slate-500">{t('loadingPredictions')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="font-semibold text-slate-800 mb-2">{t('predictiveForecast')}</div>
        <div className="text-sm text-rose-600">{t('errorLoadingForecast') || 'Error loading forecast'}</div>
        <div className="text-xs text-slate-500 mt-1">{error}</div>
      </div>
    )
  }

  if (forecasts.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="font-semibold text-slate-800 mb-2">{t('predictiveForecast')}</div>
        <div className="text-sm text-slate-500">{t('noForecastData')}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-800">{t('predictiveForecast')}</div>
        {showExplainability && (
          <div className="text-xs text-slate-500">(Parent-only insight)</div>
        )}
      </div>
      <ul className="text-sm text-slate-700 grid gap-2">
        {forecasts
          .filter((forecast) => {
            const { forecast: forecastData } = forecast
            // Filter out error forecasts or forecasts with no data
            if (!forecastData || !forecastData.message) return false
            // Skip if it's an error message with no current value
            const isError = forecastData.message.toLowerCase().includes('error') || 
                           forecastData.message.toLowerCase().includes('no ') && forecastData.currentValue === 0
            if (isError && forecastData.currentValue === 0 && forecastData.confidence === 0) return false
            return true
          })
          .slice(0, 3)
          .map((forecast, idx) => {
            const { forecast: forecastData } = forecast
            const icon = forecastData.onTrack ? '✅' : '⚠️'
            
            return (
              <li key={idx} className="flex items-start gap-2">
                <span>{icon}</span>
                <span>{forecastData.message}</span>
              </li>
            )
          })}
        {forecasts.filter(f => {
          const fd = f.forecast
          if (!fd || !fd.message) return false
          const isError = fd.message.toLowerCase().includes('error') || 
                         (fd.message.toLowerCase().includes('no ') && fd.currentValue === 0 && fd.confidence === 0)
          return !isError
        }).length === 0 && (
          <li className="text-slate-500">{t('noPredictionsAvailable')}</li>
        )}
      </ul>
    </div>
  )
}

function ParentTipsSection({ t }: { t: (k:string)=>string }) {
  const tips = [
    t('encourageTip1'),
    t('encourageTip2'),
    t('encourageTip3')
  ]
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-2">{t('parentTips')}</div>
      <div className="grid md:grid-cols-3 gap-3">
        {tips.map((t,i)=> (
          <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">💡 {t}</div>
        ))}
      </div>
    </div>
  )
}

function WeeklySnapshotCard({ subjects, momentum, t, locale, showPercentages = true, useSimpleLanguage = false }: { subjects: SubjectProgress[]; momentum: number; t:(k:string)=>string; locale: string; showPercentages?: boolean; useSimpleLanguage?: boolean }) {
  const translateSubject = (name: string) => {
    const map: Record<string, string> = {
      'Math': t('subjectMath'),
      'Science': t('subjectScience'),
      'English': t('subjectEnglish'),
      'Biology': t('subjectBiology'),
      'Chemistry': t('subjectChemistry'),
      'Physics': t('subjectPhysics'),
      'History': t('subjectHistory'),
      'EVS': t('subjectEVS'),
      'Social': t('subjectSocial'),
      'CS': t('subjectCS')
    }
    return map[name] || name
  }
  const improved = subjects.filter(s=> (s.delta||0)>0).map(s=> locale === 'ar' ? translateSubject(s.subject) : s.subject).slice(0,3).join(', ')
  const time = 4.6
  const goals = 2
  const defaultSubjects = locale === 'ar' ? `${t('subjectMath')}, ${t('subjectEnglish')}` : 'Math, English'
  
  // Show simplified version for early primary
  if (useSimpleLanguage) {
    return (
      <div className="rounded-2xl bg-white shadow-soft p-5">
        <div className="font-semibold text-slate-800 mb-2">{t('weeklySnapshot')}</div>
        <ul className="text-sm text-slate-700 grid gap-1">
          <li>✅ {improved || defaultSubjects} {t('doingWell') || 'are doing well!'}</li>
          <li>🕒 {time} {t('hours') || 'hours'} {t('studied') || 'studied'}</li>
          <li>💬 {t('keepPracticing') || 'Keep practicing!'}</li>
        </ul>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5">
      <div className="font-semibold text-slate-800 mb-2">{t('weeklySnapshot')}</div>
      <ul className="text-sm text-slate-700 grid gap-1">
        <li>✅ {t('improvedSubjects')}: {improved || defaultSubjects}</li>
        <li>🕒 {t('timeSpent')}: {time} hrs</li>
        {showPercentages && <li>🎯 {t('goalsAchieved')}: {goals}</li>}
        <li>💬 {t('focusNextWeek')}: {t('keepConsistentPractice')}</li>
      </ul>
      <div className="text-xs text-slate-500 mt-2">{t('momentumPrefix')} {momentum} — {t('greatEnergyThisWeek')}</div>
    </div>
  )
}

export default function AcademicProgress({ t, locale, localizeDigits, selectedStudentId: propSelectedStudentId }: { t: (k:string)=>string; locale: string; localizeDigits?: (v:any)=>string; selectedStudentId?: string | null }): JSX.Element {
  const { user } = useAuth()
  const { students, loading: studentsLoading } = useStudents(user?._id)
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(propSelectedStudentId || null)
  
  // Sync with prop
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

  // Reset selected student if current selection is invalid
  React.useEffect(() => {
    if (students && students.length > 0 && selectedStudentId) {
      const studentExists = students.some(s => s._id === selectedStudentId)
      if (!studentExists) {
        setSelectedStudentId(students[0]._id)
      }
    }
  }, [students, selectedStudentId])

  const selectedStudent = students?.find(s => s._id === selectedStudentId) || students?.[0]
  
  // Get adaptive configuration (user-adaptive, not just grade-adaptive)
  const gradeLevel = selectedStudent?.gradeLevel || 5
  const adaptiveConfig = useUserAdaptive(selectedStudent?._id, gradeLevel)
  const { config, preferences } = adaptiveConfig
  
  // Track page view as interaction
  React.useEffect(() => {
    if (selectedStudent?._id) {
      adaptiveConfig.trackInteraction('academicProgress')
      // Log settings opened for evaluation
      evaluationLogger.log({
        eventType: 'settings_opened',
        studentId: selectedStudent._id,
        data: { source: 'academic_progress_page' }
      })
    }
  }, [selectedStudent?._id, adaptiveConfig])
  
  // For backward compatibility, also get grade config
  const { config: gradeConfig } = useGradeMode(selectedStudent?._id, gradeLevel)
  
  // Check if this is first visit (no preferences set)
  const isFirstVisit = !preferences || Object.keys(preferences.featureOverrides || {}).length === 0
  
  // Fetch performance and engagement data - only when student is selected
  const { metrics: performanceMetrics, insights: performanceInsights, loading: performanceLoading, error: performanceError } = usePerformance(selectedStudent?._id || '')
  const { metrics: engagementMetrics, loading: engagementLoading, error: engagementError } = useEngagement(selectedStudent?._id || '')
  const { grades, loading: gradesLoading } = useGrades(selectedStudent?._id || undefined)
  const { courses, loading: coursesLoading } = useCourses(selectedStudent?._id || undefined)
  const { forecasts, loading: forecastsLoading, error: forecastsError } = useForecast(selectedStudent?._id || undefined)
  
  // Get goals with predictions using the new Goals API
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals(selectedStudent?._id || undefined)
  
  // Get at-risk prediction (Early Warning System)
  const { prediction: atRiskPrediction, loading: atRiskLoading } = useAtRisk(selectedStudent?._id || undefined)
  
  // Real-time updates for selected student
  const { lastUpdate } = useRealtime(selectedStudent?._id)
  
  // Refresh data on real-time updates
  React.useEffect(() => {
    if (lastUpdate) {
      // Refresh relevant data based on update type
      if (lastUpdate.type === 'grade' || lastUpdate.type === 'goal' || lastUpdate.type === 'forecast') {
        refreshGoals()
        // Note: useForecast, useGrades, etc. don't have refresh methods exposed,
        // but the real-time event will trigger a re-render with updated data
      }
    }
  }, [lastUpdate, refreshGoals])

  // Transform data to match component expectations
  const subjects = React.useMemo(() => {
    if (!performanceMetrics || !courses || !grades) return []
    
    const subjectColors = ['bg-brand-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']
    const subjectMap = new Map<string, { grades: number[], course: any }>()
    
    // Group grades by subject
    grades.forEach(grade => {
      const course = courses.find(c => c._id === grade.courseId)
      if (course) {
        const subject = course.subject
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { grades: [], course })
        }
        subjectMap.get(subject)!.grades.push(grade.percentage)
      }
    })
    
    // Create subject progress data
    return Array.from(subjectMap.entries())
      .map(([subject, data], idx) => {
        // Calculate average with proper precision based on grade mode
        const rawAvg = data.grades.reduce((a, b) => a + b, 0) / data.grades.length
        // Round to 1 decimal for upper primary, 2 decimals for middle/senior, whole number for early primary
        const avgGrade = gradeConfig.mode === 'upper-primary' 
          ? Math.round(rawAvg * 10) / 10  // 1 decimal (e.g., 80.3)
          : gradeConfig.mode === 'early-primary'
          ? Math.round(rawAvg)  // Whole number (though shouldn't be displayed)
          : Math.round(rawAvg * 100) / 100  // 2 decimals (e.g., 80.29)
        const previousAvg = avgGrade - (Math.random() * 10 - 5) // Simulate previous average
        const delta = Math.round(avgGrade - previousAvg)
        
        // Generate trend data from weekly progress if available
        const weeklyProgress = performanceMetrics.weeklyProgress || []
        const trend: WeeklyPoint[] = weeklyProgress.length > 0
          ? weeklyProgress.slice(-4).map((wp, i) => ({ week: `W${i + 1}`, value: wp.overallScore || avgGrade - (4 - i) * 2 }))
          : [
              { week: 'W1', value: Math.max(0, avgGrade - 6) },
              { week: 'W2', value: Math.max(0, avgGrade - 4) },
              { week: 'W3', value: Math.max(0, avgGrade - 2) },
              { week: 'W4', value: avgGrade }
            ]
        
        return {
          subject,
          percent: avgGrade,
          color: subjectColors[idx % subjectColors.length],
          trend,
          delta,
          avg: avgGrade + Math.round(Math.random() * 10 - 5) // Class average approximation
        }
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5) // Top 5 subjects
  }, [performanceMetrics, courses, grades])

  const momentum = React.useMemo(() => {
    if (!engagementMetrics) return 0
    return Math.round(engagementMetrics.currentEngagement * 100)
  }, [engagementMetrics])

  // Use performance insights directly
  const insights = React.useMemo(() => {
    if (!performanceInsights || !Array.isArray(performanceInsights) || performanceInsights.length === 0) {
      return []
    }
    return performanceInsights.map(i => ({
      type: i.type || 'trend',
      subject: i.subject || i.title || t('overall'),
      message: i.message || i.description || '',
      confidence: i.confidence || 0.5
    }))
  }, [performanceInsights])

  const childAvg = subjects.length ? Math.round(subjects.reduce((s, p) => s + p.percent, 0) / subjects.length) : 0
  const classAvg = 74 // This could come from API in the future

  const isLoading = studentsLoading || performanceLoading || engagementLoading || gradesLoading || coursesLoading
  const hasError = performanceError || engagementError

  if (studentsLoading) {
    return (
      <div className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-slate-600">{t('loadingAcademicProgress')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedStudent && students && students.length === 0) {
    return (
      <div className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 card">
          <EmptyState
            icon="👤"
            title={t('noStudents') || 'No Student Records'}
            message={t('noStudentsMessage') || 'No student records found for your account. Please contact your administrator to link a student to your account.'}
          />
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 card">
          <div className="text-center p-8">
            <p className="text-rose-600 mb-4">{t('errorLoadingAcademicProgress')}</p>
            <p className="text-sm text-slate-500">{performanceError || engagementError}</p>
          </div>
        </div>
      </div>
    )
  }

  const children: ChildProfile[] = students?.map(s => ({ id: s._id, name: getStudentDisplayName(s, locale) })) || []

  // Determine feature visibility reasons for transparency
  const getFeatureReason = (featureKey: string): 'default' | 'enabled' | 'disabled' | 'behavioral' | 'complexity' => {
    if (preferences?.featureOverrides[featureKey] === true) return 'enabled'
    if (preferences?.featureOverrides[featureKey] === false) return 'disabled'
    if (preferences?.behavioralAdaptations?.autoShowFeatures.includes(featureKey)) return 'behavioral'
    if (preferences?.behavioralAdaptations?.autoHideFeatures.includes(featureKey)) return 'behavioral'
    return 'default'
  }

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      {/* Onboarding Tour */}
      <DashboardOnboarding
        studentId={selectedStudent?._id}
        gradeLevel={gradeLevel}
        t={t}
      />

      {/* First-time user welcome banner */}
      {isFirstVisit && selectedStudent && !localStorage.getItem(`educonnect_banner_dismissed_${selectedStudent._id}`) && (
        <AdaptiveDashboardBanner
          onDismiss={() => {
            localStorage.setItem(`educonnect_banner_dismissed_${selectedStudent._id}`, 'true')
          }}
          onCustomize={() => {
            window.location.hash = '#/settings'
            evaluationLogger.log({
              eventType: 'settings_opened',
              studentId: selectedStudent._id,
              data: { source: 'welcome_banner' }
            })
          }}
          t={t}
          complexity={config.complexity}
          studentName={getStudentDisplayName(selectedStudent, locale)}
        />
      )}

      <header className="col-span-12 rounded-2xl bg-white shadow-soft p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <div className="text-xl font-bold text-slate-800">{t('apTitle')}</div>
              <div className="text-sm text-slate-500">{t('apSubtitle')}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('dashboardAdaptsToYou') || 'This dashboard adapts to your preferences. '}
            <button
              data-tour="customize-link"
              onClick={() => {
                window.location.hash = '#/settings'
                evaluationLogger.log({
                  eventType: 'settings_opened',
                  studentId: selectedStudent?._id,
                  data: { source: 'header_link' }
                })
              }}
              className="text-brand-600 hover:text-brand-700 font-medium underline"
            >
              {t('customizeDashboard') || 'Customize dashboard'}
            </button>
          </div>
        </div>
        {children.length > 1 && (
          <label className="text-sm text-slate-600 flex items-center gap-2">{t('childLabel')}
            <select 
              className="h-9 rounded-lg bg-slate-50 px-3" 
              value={selectedStudentId || ''} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
      </header>

      {isLoading ? (
        <div className="col-span-12 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-slate-600">{t('loadingData')}</p>
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="col-span-12 card">
          <EmptyState
            icon="📊"
            title={t('noProgressData') || 'No Progress Data Available'}
            message={t('noProgressDataMessage') || 'No academic progress data is available yet. Data will appear here once grades and performance metrics are recorded.'}
          />
        </div>
      ) : (
        <>
          <section className="col-span-12 lg:col-span-8 grid gap-3">
            {/* Growth Insights - always show, adapts to insightLength */}
            <div data-tour="growth-insights">
              <GrowthInsightsCard 
                t={t} 
                insights={insights} 
                insightLength={config.insightLength}
                useSimpleLanguage={config.useSimpleLanguage}
              />
            </div>
            
            {/* Subject Heatmap - only show if not Basic or if enabled */}
            {config.complexity !== 'basic' && config.features.subjectHeatmap ? (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('subjectHeatmap')}
                onClick={() => adaptiveConfig.trackInteraction('subjectHeatmap')}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <FeatureVisibilityBadge
                    reason={getFeatureReason('subjectHeatmap')}
                    isVisible={true}
                    t={t}
                  />
                </div>
                <SubjectHeatmap 
                  t={t} 
                  locale={locale} 
                  subjects={subjects}
                  maxColors={config.heatmapColors}
                  showPercentages={config.showPercentages}
                  gradeMode={config.gradeMode}
                />
              </div>
            ) : config.complexity !== 'basic' ? (
              <div data-tour="expandable-features">
                <ExpandableAdvancedSection
                  title={t('subjectHeatmap') || 'Subject Performance Overview'}
                  description={t('subjectHeatmapDescription') || 'Visual overview of performance across all subjects'}
                  onExpand={() => {
                    adaptiveConfig.setFeatureOverride('subjectHeatmap', true)
                    adaptiveConfig.trackInteraction('subjectHeatmap')
                  }}
                  t={t}
                />
              </div>
            ) : null}
            
            {/* Trend Charts - only show if not Basic or if enabled */}
            {config.complexity !== 'basic' && config.features.trendCharts ? (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('trendCharts')}
                onClick={() => adaptiveConfig.trackInteraction('trendCharts')}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <FeatureVisibilityBadge
                    reason={getFeatureReason('trendCharts')}
                    isVisible={true}
                    t={t}
                  />
                </div>
                <TrendCharts t={t} subjects={subjects} />
              </div>
            ) : config.complexity !== 'basic' ? (
              <ExpandableAdvancedSection
                title={t('trendCharts') || 'Performance Trends'}
                description={t('trendChartsDescription') || 'See how performance changes over time'}
                onExpand={() => {
                  adaptiveConfig.setFeatureOverride('trendCharts', true)
                  adaptiveConfig.trackInteraction('trendCharts')
                }}
                t={t}
              />
            ) : null}
            
            {/* Comparison and Momentum - always show but adapt display (Core element #2-3) */}
            <div className="grid md:grid-cols-2 gap-3" data-tour="grades-overview">
              <ComparisonCard 
                childAvg={childAvg} 
                classAvg={classAvg} 
                t={t}
                showPercentages={config.showPercentages}
                useSimpleLanguage={config.useSimpleLanguage}
                gradeMode={config.gradeMode}
              />
              <MomentumGauge value={momentum} t={t} />
            </div>
            
            {/* Communication Tips - only show if not Basic */}
            {config.complexity !== 'basic' && config.features.communicationTips && insights.filter(i => i.type === 'weakness').length > 0 && (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('communicationTips')}
                onClick={() => adaptiveConfig.trackInteraction('communicationTips')}
              >
                <CommunicationGuidance
                  concern="Supporting your child with academic challenges"
                  tips={getCommunicationTips('low-performance')}
                />
              </div>
            )}
            
            {/* Parent Tips - always show (Core element #4) */}
            {config.complexity === 'basic' ? (
              <ParentTipsSection t={t} />
            ) : (
              <ParentTipsSection t={t} />
            )}
          </section>

          <aside className="col-span-12 lg:col-span-4 grid gap-3">
            {/* Weekly Snapshot - always show (Core element #5) */}
            <WeeklySnapshotCard 
              t={t} 
              locale={locale} 
              subjects={subjects} 
              momentum={momentum}
              showPercentages={config.showPercentages}
              useSimpleLanguage={config.useSimpleLanguage}
            />
            
            {/* Advanced features only shown if not Basic */}
            {/* Early Warning System - adaptive visibility with progressive disclosure */}
            {config.features.earlyWarnings ? (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('earlyWarnings')}
                onClick={() => adaptiveConfig.trackInteraction('earlyWarnings')}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <FeatureVisibilityBadge
                    reason={getFeatureReason('earlyWarnings')}
                    isVisible={true}
                    t={t}
                  />
                </div>
                <AtRiskCard prediction={atRiskPrediction} loading={atRiskLoading} />
              </div>
            ) : (
              <ExpandableAdvancedSection
                title={t('atRiskWarnings') || 'At-Risk Warnings'}
                description={t('atRiskWarningsDescription') || 'Early warning system for academic concerns'}
                onExpand={() => {
                  adaptiveConfig.setFeatureOverride('earlyWarnings', true)
                  adaptiveConfig.trackInteraction('earlyWarnings')
                }}
                t={t}
              >
                <AtRiskCard prediction={atRiskPrediction} loading={atRiskLoading} />
              </ExpandableAdvancedSection>
            )}
            
            {/* Goals Card - adaptive visibility with progressive disclosure */}
            {config.features.goalsTracking ? (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('goalsTracking')}
                onClick={() => adaptiveConfig.trackInteraction('goalsTracking')}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <FeatureVisibilityBadge
                    reason={getFeatureReason('goalsTracking')}
                    isVisible={true}
                    t={t}
                  />
                </div>
                <GoalsCard 
                  goals={goals} 
                  forecasts={forecasts} 
                  loading={forecastsLoading || goalsLoading} 
                  studentId={selectedStudent?._id} 
                  t={t} 
                />
              </div>
            ) : (
              <ExpandableAdvancedSection
                title={t('goalsTracking') || 'Goals Tracking'}
                description={t('goalsTrackingDescription') || 'Track and monitor academic goals'}
                onExpand={() => {
                  adaptiveConfig.setFeatureOverride('goalsTracking', true)
                  adaptiveConfig.trackInteraction('goalsTracking')
                }}
                t={t}
              >
                <GoalsCard 
                  goals={goals} 
                  forecasts={forecasts} 
                  loading={forecastsLoading || goalsLoading} 
                  studentId={selectedStudent?._id} 
                  t={t} 
                />
              </ExpandableAdvancedSection>
            )}
            
            {/* Forecast Widget - adaptive visibility with progressive disclosure */}
            {config.features.predictiveForecasts ? (
              <div 
                onMouseEnter={() => adaptiveConfig.trackInteraction('predictiveForecasts')}
                onClick={() => adaptiveConfig.trackInteraction('predictiveForecasts')}
                className="relative"
              >
                <div className="absolute top-2 right-2 z-10">
                  <FeatureVisibilityBadge
                    reason={getFeatureReason('predictiveForecasts')}
                    isVisible={true}
                    t={t}
                  />
                </div>
                <ForecastWidget 
                  t={t} 
                  forecasts={forecasts} 
                  loading={forecastsLoading} 
                  error={forecastsError}
                  showExplainability={!config.useSimpleLanguage}
                />
              </div>
            ) : (
              <ExpandableAdvancedSection
                title={t('predictiveForecasts') || 'Predictive Forecasts'}
                description={t('predictiveForecastsDescription') || 'AI-powered predictions about future performance'}
                isAdvanced={true}
                onExpand={() => {
                  adaptiveConfig.setFeatureOverride('predictiveForecasts', true)
                  adaptiveConfig.trackInteraction('predictiveForecasts')
                }}
                t={t}
              >
                <ForecastWidget 
                  t={t} 
                  forecasts={forecasts} 
                  loading={forecastsLoading} 
                  error={forecastsError}
                  showExplainability={!config.useSimpleLanguage}
                />
              </ExpandableAdvancedSection>
            )}
            
            {/* Weekly Snapshot - always show */}
            <WeeklySnapshotCard 
              t={t} 
              locale={locale} 
              subjects={subjects} 
              momentum={momentum}
              showPercentages={config.showPercentages}
              useSimpleLanguage={config.useSimpleLanguage}
            />
          </aside>
        </>
      )}
    </div>
  )
}

 
