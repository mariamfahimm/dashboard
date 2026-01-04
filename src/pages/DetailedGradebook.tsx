// Detailed Gradebook Page - Beautiful UI for comprehensive grade tracking
import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGrades } from '../hooks/useGrades'
import { useCourses } from '../hooks/useCourses'
import { useAssignments } from '../hooks/useAssignments'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/EmptyState'
import { ExportButton } from '../components/ui/ExportButton'
import { exportGradesToPDF, exportToExcel } from '../utils/exportUtils'
import { printPage } from '../utils/printUtils'
import { useStudents } from '../hooks/useStudents'
import { getStudentDisplayName } from '../utils/nameUtils'
import { useGradeMode } from '../context/GradeModeContext'
import { formatPercentage, formatPercentageNumber } from '../utils/gradeModeUtils'

interface DetailedGradebookProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

export function DetailedGradebook({ selectedStudentId, t, locale }: DetailedGradebookProps) {
  const { user } = useAuth()
  const { grades, loading: gradesLoading, error: gradesError } = useGrades(selectedStudentId || undefined)
  const { courses, loading: coursesLoading } = useCourses(selectedStudentId || undefined)
  const { assignments, loading: assignmentsLoading } = useAssignments(selectedStudentId || undefined)
  const { students } = useStudents(user?._id)
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  const selectedStudent = students?.find(s => s._id === selectedStudentId)
  const studentName = selectedStudent ? getStudentDisplayName(selectedStudent, locale) : t('student')

  // Get grade mode configuration for formatting percentages
  const gradeLevel = selectedStudent?.gradeLevel || 5
  const { config: gradeConfig } = useGradeMode(selectedStudent?._id, gradeLevel)

  const loading = gradesLoading || coursesLoading || assignmentsLoading

  // Debug logging
  React.useEffect(() => {
    console.log('[DetailedGradebook] selectedStudentId:', selectedStudentId)
    console.log('[DetailedGradebook] grades:', grades?.length || 0)
    console.log('[DetailedGradebook] courses:', courses?.length || 0)
    console.log('[DetailedGradebook] assignments:', assignments?.length || 0)
    console.log('[DetailedGradebook] loading:', loading)
  }, [selectedStudentId, grades, courses, assignments, loading])

  // Group grades by subject/course
  const gradesBySubject = useMemo(() => {
    if (!grades || grades.length === 0) return {}
    
    const grouped: Record<string, {
      course: any
      grades: any[]
      average: number
      assignments: any[]
      quizzes: any[]
      exams: any[]
      projects: any[]
    }> = {}
    
    grades.forEach(grade => {
      // Try to find course, but if courses failed to load, use courseId as subject
      const course = courses?.find(c => c._id === grade.courseId)
      const subject = course?.subject || grade.courseId || t('general')
      
      if (!grouped[subject]) {
        grouped[subject] = {
          course: course || { _id: grade.courseId, subject, title: subject },
          grades: [],
          average: 0,
          assignments: [],
          quizzes: [],
          exams: [],
          projects: []
        }
      }
      grouped[subject].grades.push(grade)
      
      // Categorize by assignment type (if available)
      const assignment = assignments?.find(a => a._id === grade.assignmentId)
      if (assignment) {
        const type = assignment.type || 'assignment'
        if (type === 'quiz') grouped[subject].quizzes.push(grade)
        else if (type === 'exam') grouped[subject].exams.push(grade)
        else if (type === 'project') grouped[subject].projects.push(grade)
        else grouped[subject].assignments.push(grade)
      } else {
        // If no assignment found, default to assignments
        grouped[subject].assignments.push(grade)
      }
    })
    
    // Calculate averages with proper precision based on grade mode
    Object.keys(grouped).forEach(subject => {
      const subjectGrades = grouped[subject].grades
      if (subjectGrades.length > 0) {
        const rawAvg = subjectGrades.reduce((sum, g) => sum + g.percentage, 0) / subjectGrades.length
        // Round based on grade mode: 1 decimal for upper primary, 2 decimals for middle/senior, whole number for early primary
        grouped[subject].average = gradeConfig.mode === 'upper-primary'
          ? Math.round(rawAvg * 10) / 10  // 1 decimal
          : gradeConfig.mode === 'early-primary'
          ? Math.round(rawAvg)  // Whole number
          : Math.round(rawAvg * 100) / 100  // 2 decimals
      }
    })
    
    return grouped
  }, [grades, courses, assignments])

  const subjects = Object.keys(gradesBySubject)
  const selectedSubjectData = selectedSubject === 'all' 
    ? Object.values(gradesBySubject)
    : gradesBySubject[selectedSubject] ? [gradesBySubject[selectedSubject]] : []

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-amber-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-rose-600'
  }

  const getGradeBadgeVariant = (percentage: number): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    if (percentage >= 90) return 'success'
    if (percentage >= 80) return 'info'
    if (percentage >= 70) return 'warning'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-slate-600">{t('loadingGradebook')}</p>
        </div>
      </div>
    )
  }

  if (gradesError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center p-12">
            <EmptyState
              icon="⚠️"
              title={t('errorLoadingGrades')}
              message={gradesError}
            />
            <div className="mt-4 text-sm text-slate-500">
              <p>{t('selectedStudentId') || 'Selected Student ID'}: {selectedStudentId || t('none') || 'None'}</p>
              <p>{t('checkConsole')}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center p-12">
            <EmptyState
              icon="📊"
              title={t('noGrades')}
              message={t('noGradesMessage')}
            />
            <div className="mt-4 text-sm text-slate-500">
              <p>Selected Student ID: {selectedStudentId || 'None'}</p>
              <p>Grades loaded: {grades?.length || 0}</p>
              <p>Check the browser console for API response details.</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('detailedGradebook')}</h1>
            <p className="text-slate-600">{t('comprehensiveViewGrades')}</p>
          </div>
          <div className="no-print">
            <ExportButton
              onPrint={() => printPage()}
              onExportPDF={() => {
                const allGrades = selectedSubject === 'all' 
                  ? grades || []
                  : grades?.filter(g => {
                      const course = courses?.find(c => c._id === g.courseId)
                      return course?.subject === selectedSubject
                    }) || []
                exportGradesToPDF(studentName, allGrades)
              }}
              onExportExcel={() => {
                const allGrades = selectedSubject === 'all' 
                  ? grades || []
                  : grades?.filter(g => {
                      const course = courses?.find(c => c._id === g.courseId)
                      return course?.subject === selectedSubject
                    }) || []
                const excelData = allGrades.map(grade => {
                  const assignment = assignments?.find(a => a._id === grade.assignmentId)
                  const course = courses?.find(c => c._id === grade.courseId)
                  return {
                    Subject: course?.subject || 'N/A',
                    Assignment: assignment?.title || 'N/A',
                    Type: assignment?.type || 'Assignment',
                    Score: `${grade.score} / ${grade.maxScore}`,
                    Percentage: `${grade.percentage}%`,
                    Grade: grade.grade || 'N/A',
                    Date: grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : 'N/A'
                  }
                })
                exportToExcel(excelData, 'Grades', `${studentName}_Grades_${Date.now()}.xlsx`)
              }}
            />
          </div>
        </div>

        {/* Subject Filter & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`
                px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                ${selectedSubject === 'all'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                }
              `}
            >
              {t('allSubjects')}
            </button>
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                  ${selectedSubject === subject
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                  }
                `}
              >
                {subject}
                {gradesBySubject[subject] && (
                  <span className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                    ${selectedSubject === subject 
                      ? 'bg-white/20 text-white' 
                      : 'bg-brand-100 text-brand-600'
                    }
                  `}>
                    {formatPercentageNumber(gradesBySubject[subject].average, gradeConfig.mode === 'upper-primary' ? 1 : gradeConfig.mode === 'early-primary' ? 0 : 2)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-soft">
            <button
              onClick={() => setViewMode('table')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === 'table' 
                  ? 'bg-brand-500 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {t('table')}
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === 'cards' 
                  ? 'bg-brand-500 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              {t('cards')}
            </button>
          </div>
        </div>

        {/* Gradebook Content */}
        <div className="space-y-6">
          {selectedSubjectData.map((subjectData) => (
            <Card key={subjectData.course._id} className="overflow-hidden" padding="none">
              {/* Subject Header */}
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{subjectData.course.subject || subjectData.course.title}</h2>
                    <p className="text-white/80 text-sm">{subjectData.course.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80 mb-1">{t('overallAverage')}</div>
                    <div className="text-4xl font-bold">{formatPercentageNumber(subjectData.average, gradeConfig.mode === 'upper-primary' ? 1 : gradeConfig.mode === 'early-primary' ? 0 : 2)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Grade Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Assignments</div>
                    <div className="text-2xl font-bold text-slate-900">{subjectData.assignments.length}</div>
                    {subjectData.assignments.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Avg: {Math.round(
                          subjectData.assignments.reduce((sum, g) => sum + g.percentage, 0) / 
                          subjectData.assignments.length
                        )}%
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Quizzes</div>
                    <div className="text-2xl font-bold text-slate-900">{subjectData.quizzes.length}</div>
                    {subjectData.quizzes.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Avg: {Math.round(
                          subjectData.quizzes.reduce((sum, g) => sum + g.percentage, 0) / 
                          subjectData.quizzes.length
                        )}%
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Exams</div>
                    <div className="text-2xl font-bold text-slate-900">{subjectData.exams.length}</div>
                    {subjectData.exams.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Avg: {Math.round(
                          subjectData.exams.reduce((sum, g) => sum + g.percentage, 0) / 
                          subjectData.exams.length
                        )}%
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">Projects</div>
                    <div className="text-2xl font-bold text-slate-900">{subjectData.projects.length}</div>
                    {subjectData.projects.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1">
                        Avg: {Math.round(
                          subjectData.projects.reduce((sum, g) => sum + g.percentage, 0) / 
                          subjectData.projects.length
                        )}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Grades Table */}
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Assignment</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Score</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700">Percentage</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectData.grades.map((grade) => {
                          const assignment = assignments?.find(a => a._id === grade.assignmentId)
                          return (
                            <tr 
                              key={grade._id} 
                              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <Badge variant="default" size="sm">
                                  {assignment?.type || 'Assignment'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-900">
                                {assignment?.title || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-sm">
                                {grade.gradedAt 
                                  ? new Date(grade.gradedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'N/A'
                                }
                              </td>
                              <td className="py-3 px-4 text-right font-medium">
                                {grade.score} / {grade.maxScore}
                              </td>
                              <td className={`py-3 px-4 text-right font-bold ${getGradeColor(grade.percentage)}`}>
                                {grade.percentage}%
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={getGradeBadgeVariant(grade.percentage)} size="sm">
                                  {grade.percentage >= 90 ? t('excellent') || 'Excellent' :
                                   grade.percentage >= 80 ? t('good') || 'Good' :
                                   grade.percentage >= 70 ? t('average') :
                                   grade.percentage >= 60 ? t('belowAverage') : t('needsImprovement')}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectData.grades.map((grade) => {
                      const assignment = assignments?.find(a => a._id === grade.assignmentId)
                      return (
                        <Card key={grade._id} hover className="border-l-4 border-l-brand-500">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="default" size="sm">
                              {assignment?.type || 'Assignment'}
                            </Badge>
                            <Badge variant={getGradeBadgeVariant(grade.percentage)} size="sm">
                              {grade.percentage}%
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-2">
                            {assignment?.title || 'N/A'}
                          </h3>
                          <div className="space-y-1 text-sm text-slate-600 mb-3">
                            <div>Score: <span className="font-medium">{grade.score} / {grade.maxScore}</span></div>
                            {grade.gradedAt && (
                              <div>
                                Graded: {new Date(grade.gradedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                grade.percentage >= 90 ? 'bg-emerald-500' :
                                grade.percentage >= 80 ? 'bg-blue-500' :
                                grade.percentage >= 70 ? 'bg-amber-500' :
                                grade.percentage >= 60 ? 'bg-orange-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${grade.percentage}%` }}
                            />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

