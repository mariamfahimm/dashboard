// Children Management Page - Multi-child management interface
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { studentsApi } from '../services/api/studentsApi'
import { ChildCard } from '../components/ChildCard'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/ui/Button'

interface ChildrenManagementProps {
  selectedStudentId?: string | null
  onStudentSelect: (studentId: string) => void
  t: (key: string) => string
}

export function ChildrenManagement({ selectedStudentId, onStudentSelect, t }: ChildrenManagementProps) {
  const { user } = useAuth()
  const { students, loading, error, refresh } = useStudents(user?._id)
  const [showRequestLink, setShowRequestLink] = useState(false)
  const [linkingCode, setLinkingCode] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifiedStudent, setVerifiedStudent] = useState<{ name: string; gradeLevel: number } | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
          </div>
          <p className="text-slate-600">{t('loadingChildren')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Children</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full">
          <EmptyState
            icon="👨‍👩‍👧‍👦"
            title="No Children Linked"
            message="You don't have any children linked to your account yet. Contact your school administrator to link your children, or use the request link feature below."
          />
          <div className="mt-6 bg-white rounded-2xl shadow-soft p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Request to Link a Child</h3>
            <p className="text-sm text-slate-600 mb-4">
              If you have a secure linking code from your school, enter it below to link a child to your account.
            </p>
            {linkError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                {linkError}
              </div>
            )}
            {linkSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                Child linked successfully! The student should now appear in your children list.
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter secure linking code"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none uppercase"
                value={linkingCode}
                onChange={(e) => {
                  setLinkingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
                  setLinkError(null)
                  setLinkSuccess(false)
                  setVerifiedStudent(null)
                }}
                onBlur={async () => {
                  if (linkingCode.length === 8) {
                    setVerifying(true)
                    try {
                      const response = await studentsApi.verifyLinkingCode(linkingCode)
                      if (response.success && response.data) {
                        setVerifiedStudent({
                          name: response.data.name,
                          gradeLevel: response.data.gradeLevel
                        })
                        setLinkError(null)
                      }
                    } catch (err: any) {
                      setVerifiedStudent(null)
                      if (err.message?.includes('expired')) {
                        setLinkError(t('linkingCodeExpired'))
                      } else {
                        setLinkError(t('invalidLinkingCode'))
                      }
                    } finally {
                      setVerifying(false)
                    }
                  }
                }}
                disabled={isLinking}
                maxLength={8}
              />
              <Button
                onClick={async () => {
                  if (!linkingCode || linkingCode.length !== 8) {
                    setLinkError(t('pleaseEnterValidCode'))
                    return
                  }

                  setIsLinking(true)
                  setLinkError(null)
                  setLinkSuccess(false)

                  try {
                    const response = await studentsApi.linkByCode(linkingCode)
                    if (response.success) {
                      setLinkSuccess(true)
                      setLinkingCode('')
                      setVerifiedStudent(null)
                      // Refresh students list
                      await refresh()
                      // Clear success message after 3 seconds
                      setTimeout(() => setLinkSuccess(false), 3000)
                    }
                  } catch (err: any) {
                    console.error('Link error:', err)
                    setLinkError(err.message || 'Failed to link child. Please check the code and try again.')
                  } finally {
                    setIsLinking(false)
                  }
                }}
                disabled={isLinking || linkingCode.length !== 8}
              >
                {isLinking ? t('linking') : t('linkChild')}
              </Button>
            </div>
            {verifying && (
              <p className="text-xs text-slate-500 mt-2">Verifying code...</p>
            )}
            {verifiedStudent && !linkError && (
              <p className="text-xs text-emerald-600 mt-2">
                ✓ Valid code for {verifiedStudent.name} (Grade {verifiedStudent.gradeLevel})
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('myChildren')}</h1>
          <p className="text-slate-600">{t('selectChildViewDashboard')}</p>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {students.map((student) => (
            <ChildCard
              key={student._id}
              student={{
                _id: student._id,
                name: student.name,
                gradeLevel: student.gradeLevel,
                studentId: student.studentId,
                avatar: student.avatar,
                class: (student as any).class,
                homeroomTeacher: (student as any).homeroomTeacher
              }}
              isSelected={selectedStudentId === student._id}
              onClick={() => onStudentSelect(student._id)}
              showRequestLink={false}
            />
          ))}
        </div>

        {/* Request to Link Another Child */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">{t('linkAnotherChild')}</h3>
              <p className="text-sm text-slate-600">
                {t('haveAnotherChildMessage')}
              </p>
            </div>
            <button
              onClick={() => setShowRequestLink(!showRequestLink)}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              {showRequestLink ? t('cancel') : t('requestLink')}
            </button>
          </div>
          
          {showRequestLink && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              {linkError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  Child linked successfully! The student should now appear in your children list.
                </div>
              )}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter secure linking code"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none uppercase"
                  value={linkingCode}
                  onChange={(e) => {
                    setLinkingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
                    setLinkError(null)
                    setLinkSuccess(false)
                    setVerifiedStudent(null)
                  }}
                  onBlur={async () => {
                    if (linkingCode.length === 8) {
                      setVerifying(true)
                      try {
                        const response = await studentsApi.verifyLinkingCode(linkingCode)
                        if (response.success && response.data) {
                          setVerifiedStudent({
                            name: response.data.name,
                            gradeLevel: response.data.gradeLevel
                          })
                          setLinkError(null)
                        }
                      } catch (err: any) {
                        setVerifiedStudent(null)
                        if (err.message?.includes('expired')) {
                        setLinkError(t('linkingCodeExpired'))
                      } else {
                        setLinkError(t('invalidLinkingCode'))
                        }
                      } finally {
                        setVerifying(false)
                      }
                    }
                  }}
                  disabled={isLinking}
                  maxLength={8}
                />
                <Button
                  onClick={async () => {
                    if (!linkingCode || linkingCode.length !== 8) {
                      setLinkError(t('pleaseEnterValidCode'))
                      return
                    }

                    setIsLinking(true)
                    setLinkError(null)
                    setLinkSuccess(false)

                    try {
                      const response = await studentsApi.linkByCode(linkingCode)
                      if (response.success) {
                        setLinkSuccess(true)
                        setLinkingCode('')
                        setVerifiedStudent(null)
                        setShowRequestLink(false)
                        // Refresh students list
                        await refresh()
                        // Clear success message after 3 seconds
                        setTimeout(() => setLinkSuccess(false), 3000)
                      }
                    } catch (err: any) {
                      console.error('Link error:', err)
                      setLinkError(err.message || 'Failed to link child. Please check the code and try again.')
                    } finally {
                      setIsLinking(false)
                    }
                  }}
                  disabled={isLinking || linkingCode.length !== 8}
                >
                  {isLinking ? t('linking') : t('linkChild')}
                </Button>
              </div>
              {verifying && (
                <p className="text-xs text-slate-500 mt-2">Verifying code...</p>
              )}
              {verifiedStudent && !linkError && (
                <p className="text-xs text-emerald-600 mt-2">
                  ✓ Valid code for {verifiedStudent.name} (Grade {verifiedStudent.gradeLevel})
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Contact your school administrator if you don't have a linking code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

