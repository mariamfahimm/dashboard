// Fees Management Page - View and manage student fees and payments
import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudents } from '../hooks/useStudents'
import { useFees, usePaymentHistory } from '../hooks/useFees'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'
import { ExportButton } from '../components/ui/ExportButton'
import { PaymentModal } from '../components/ui/PaymentModal'
import { printPage } from '../utils/printUtils'
import { exportFeesToPDF, exportFeesToExcel, generateReceiptPDF } from '../utils/exportUtils'
import { formatDate as formatDateUtil } from '../utils/dateUtils'
import { getStudentDisplayName } from '../utils/nameUtils'
import type { Fee } from '../services/api/feesApi'

interface FeesPageProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

const getFeeTypes = (t: (key: string) => string) => [
  { value: 'tuition', label: t('tuition'), icon: '📚', color: 'bg-blue-500' },
  { value: 'activity', label: t('activity'), icon: '🎭', color: 'bg-purple-500' },
  { value: 'transport', label: t('transport'), icon: '🚌', color: 'bg-green-500' },
  { value: 'library', label: t('library'), icon: '📖', color: 'bg-amber-500' },
  { value: 'technology', label: t('technology'), icon: '💻', color: 'bg-indigo-500' },
  { value: 'other', label: t('other'), icon: '📋', color: 'bg-slate-500' }
]

export function FeesPage({ selectedStudentId, t, locale }: FeesPageProps) {
  const { user } = useAuth()
  const { students } = useStudents(user?._id)
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'history'>('overview')
  const [filterType, setFilterType] = useState<string>('all')

  const { fees, stats, loading, error, refresh } = useFees(
    selectedStudentId || undefined,
    activeTab === 'pending' ? { status: 'pending' } : activeTab === 'overview' ? undefined : undefined
  )

  const { history, loading: historyLoading, refresh: refreshHistory } = usePaymentHistory(
    activeTab === 'history' ? selectedStudentId || undefined : undefined
  )

  const selectedStudent = students?.find(s => s._id === selectedStudentId)
  const studentName = selectedStudent ? getStudentDisplayName(selectedStudent, locale) : t('student')
  const FEE_TYPES = getFeeTypes(t)

  // Payment modal state
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handlePaymentSuccess = () => {
    // Refresh fees and stats
    refresh()
    // Refresh history if on history tab
    if (activeTab === 'history') {
      refreshHistory()
    }
  }

  // Filter fees by type
  const filteredFees = useMemo(() => {
    if (!fees) return []
    if (filterType === 'all') return fees
    return fees.filter(fee => fee.feeType === filterType)
  }, [fees, filterType])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount)
  }

  // Format date using Gregorian calendar
  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString, locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status color
  const getStatusColor = (status: Fee['status']) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'info'
      case 'overdue': return 'danger'
      case 'partial': return 'warning'
      case 'waived': return 'default'
      default: return 'default'
    }
  }

  // Get fee type info
  const getFeeTypeInfo = (type: Fee['feeType']) => {
    return FEE_TYPES.find(ft => ft.value === type) || FEE_TYPES[5]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-slate-600">{t('loadingFeesInformation')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('errorLoadingFees')}</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={refresh}>Try Again</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Fees & Payments</h1>
            <p className="text-slate-600">Manage fees and payment history for {studentName}</p>
          </div>
          <div className="no-print">
            <ExportButton
              onPrint={printPage}
              onExportPDF={() => {
                if (fees.length === 0) {
                  alert('No fees data to export')
                  return
                }
                exportFeesToPDF(studentName, fees, stats)
              }}
              onExportExcel={() => {
                if (fees.length === 0) {
                  alert('No fees data to export')
                  return
                }
                exportFeesToExcel(studentName, fees, stats)
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="text-sm opacity-90 mb-1">{t('totalFees')}</div>
              <div className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <div className="text-xs opacity-75 mt-1">{stats.totalFees} {t('feesLabel')}</div>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="text-sm opacity-90 mb-1">{t('totalPaid')}</div>
              <div className="text-3xl font-bold">{formatCurrency(stats.totalPaid)}</div>
              <div className="text-xs opacity-75 mt-1">{stats.paidCount} {t('paidLabel')}</div>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="text-sm opacity-90 mb-1">{t('pendingBalance')}</div>
              <div className="text-3xl font-bold">{formatCurrency(stats.totalPending)}</div>
              <div className="text-xs opacity-75 mt-1">{stats.pendingCount} {t('pendingLabel')}</div>
            </Card>
            <Card className={`bg-gradient-to-br ${stats.overdueCount > 0 ? 'from-rose-500 to-rose-600' : 'from-slate-500 to-slate-600'} text-white`}>
              <div className="text-sm opacity-90 mb-1">{t('overdue')}</div>
              <div className="text-3xl font-bold">{formatCurrency(stats.overdueAmount)}</div>
              <div className="text-xs opacity-75 mt-1">{stats.overdueCount} {t('overdueLabel')}</div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-soft w-fit">
            {[
              { key: 'overview', label: t('overview'), icon: '📊' },
              { key: 'pending', label: t('pending'), icon: '⏳' },
              { key: 'history', label: t('paymentHistory'), icon: '📜' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.key
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filter by fee type */}
            {fees && fees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${filterType === 'all'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                    }
                  `}
                >
                  {t('allTypes')}
                </button>
                {FEE_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${filterType === type.value
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                      }
                    `}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Fees List */}
            {filteredFees.length === 0 ? (
              <Card>
                <EmptyState
                  icon="💰"
                  title={t('noFeesFound')}
                  message={t('noFeesAssigned')}
                  className="p-8"
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFees.map(fee => {
                  const feeTypeInfo = getFeeTypeInfo(fee.feeType)
                  const remaining = fee.amount - fee.paidAmount
                  const isOverdue = fee.status === 'overdue' || (new Date(fee.dueDate) < new Date() && fee.status !== 'paid')

                  return (
                    <Card key={fee._id} className={isOverdue ? 'border-l-4 border-l-rose-500' : ''}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-xl ${feeTypeInfo.color} text-white flex items-center justify-center text-xl`}>
                              {feeTypeInfo.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{fee.description}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="default" size="sm">{feeTypeInfo.label}</Badge>
                                <Badge variant={getStatusColor(fee.status)} size="sm">
                                  {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="danger" size="sm">{t('overdue')}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ml-16 grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="text-sm text-slate-600 mb-1">{t('dueDate')}</div>
                              <div className="font-semibold text-slate-900">{formatDate(fee.dueDate)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-600 mb-1">{t('amount')}</div>
                              <div className="font-semibold text-slate-900">{formatCurrency(fee.amount)}</div>
                            </div>
                            {fee.paidAmount > 0 && (
                              <>
                                <div>
                                  <div className="text-sm text-slate-600 mb-1">{t('paid')}</div>
                                  <div className="font-semibold text-emerald-600">{formatCurrency(fee.paidAmount)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-slate-600 mb-1">{t('remaining')}</div>
                                  <div className="font-semibold text-slate-900">{formatCurrency(remaining)}</div>
                                </div>
                                {fee.paidDate && (
                                  <div>
                                    <div className="text-sm text-slate-600 mb-1">{t('paidDate')}</div>
                                    <div className="font-semibold text-slate-900">{formatDate(fee.paidDate)}</div>
                                  </div>
                                )}
                                {fee.receiptNumber && (
                                  <div>
                                    <div className="text-sm text-slate-600 mb-1">{t('receiptNumber')}</div>
                                    <div className="font-semibold text-slate-900">{fee.receiptNumber}</div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {fee.notes && (
                            <div className="ml-16 mt-3 p-3 bg-slate-50 rounded-lg">
                              <div className="text-xs text-slate-600 mb-1">{t('notes')}</div>
                              <div className="text-sm text-slate-700">{fee.notes}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {fee.status !== 'paid' && fee.status !== 'waived' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFee(fee)
                                setShowPaymentModal(true)
                              }}
                            >
                              {t('payNow')}
                            </Button>
                          )}
                          {fee.status === 'paid' && fee.payments && fee.payments.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Generate receipt for the latest payment
                                const latestPayment = fee.payments[fee.payments.length - 1]
                                generateReceiptPDF(
                                  {
                                    fee: {
                                      description: fee.description,
                                      feeType: fee.feeType,
                                      amount: fee.amount
                                    },
                                    amount: latestPayment.amount,
                                    paymentDate: latestPayment.paymentDate,
                                    paymentMethod: latestPayment.paymentMethod,
                                    receiptNumber: latestPayment.receiptNumber,
                                    notes: latestPayment.notes
                                  },
                                  studentName,
                                  user?.name
                                )
                              }}
                            >
                              {t('downloadReceipt')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div>
            {filteredFees.filter(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partial').length === 0 ? (
              <Card>
                <EmptyState
                  icon="✅"
                  title={t('noPendingFees')}
                  message={t('allFeesPaid')}
                  className="p-8"
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFees
                  .filter(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partial')
                  .map(fee => {
                    const feeTypeInfo = getFeeTypeInfo(fee.feeType)
                    const remaining = fee.amount - fee.paidAmount

                    return (
                      <Card key={fee._id} className={fee.status === 'overdue' ? 'border-l-4 border-l-rose-500 bg-rose-50/30' : ''}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-12 h-12 rounded-xl ${feeTypeInfo.color} text-white flex items-center justify-center text-xl`}>
                                {feeTypeInfo.icon}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">{fee.description}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="default" size="sm">{feeTypeInfo.label}</Badge>
                                  <Badge variant={getStatusColor(fee.status)} size="sm">
                                    {fee.status === 'overdue' ? t('overdue') : fee.status === 'paid' ? t('paid') : fee.status === 'partial' ? t('partial') : fee.status === 'waived' ? t('waived') : fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="ml-16 grid md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <div className="text-sm text-slate-600 mb-1">{t('dueDate')}</div>
                                <div className={`font-semibold ${fee.status === 'overdue' ? 'text-rose-600' : 'text-slate-900'}`}>
                                  {formatDate(fee.dueDate)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-600 mb-1">{t('totalAmount')}</div>
                                <div className="font-semibold text-slate-900">{formatCurrency(fee.amount)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-600 mb-1">{t('remainingBalance')}</div>
                                <div className="font-semibold text-slate-900">{formatCurrency(remaining)}</div>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedFee(fee)
                              setShowPaymentModal(true)
                            }}
                          >
                            Pay Now
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <Card>
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">📜</span>
                  </div>
                  <p className="text-slate-600">Loading payment history...</p>
                </div>
              </Card>
            ) : history.length === 0 ? (
              <Card>
                <EmptyState
                  icon="📜"
                  title={t('noPaymentHistory')}
                  message={t('noPaymentRecords')}
                  className="p-8"
                />
              </Card>
            ) : (
              <div className="space-y-4">
                {history.map(fee => {
                  const feeTypeInfo = getFeeTypeInfo(fee.feeType)
                  
                  return (
                    <Card key={fee._id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-xl ${feeTypeInfo.color} text-white flex items-center justify-center text-xl`}>
                              {feeTypeInfo.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{fee.description}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="default" size="sm">{feeTypeInfo.label}</Badge>
                                <Badge variant="success" size="sm">{t('paid')}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="ml-16 grid md:grid-cols-3 gap-4 mt-4">
                            <div>
                              <div className="text-sm text-slate-600 mb-1">{t('paymentDate')}</div>
                              <div className="font-semibold text-slate-900">
                                {fee.paidDate ? formatDate(fee.paidDate) : t('na')}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-600 mb-1">{t('amountPaid')}</div>
                              <div className="font-semibold text-emerald-600">{formatCurrency(fee.paidAmount)}</div>
                            </div>
                            {fee.paymentMethod && (
                              <div>
                                <div className="text-sm text-slate-600 mb-1">{t('paymentMethod')}</div>
                                <div className="font-semibold text-slate-900">
                                  {fee.paymentMethod.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </div>
                              </div>
                            )}
                            {fee.receiptNumber && (
                              <div>
                                <div className="text-sm text-slate-600 mb-1">{t('receiptNumber')}</div>
                                <div className="font-semibold text-slate-900">{fee.receiptNumber}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        {fee.receiptNumber && fee.payments && fee.payments.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Generate receipt for the latest payment
                              const latestPayment = fee.payments[fee.payments.length - 1]
                              generateReceiptPDF(
                                {
                                  fee: {
                                    description: fee.description,
                                    feeType: fee.feeType,
                                    amount: fee.amount
                                  },
                                  amount: latestPayment.amount,
                                  paymentDate: latestPayment.paymentDate,
                                  paymentMethod: latestPayment.paymentMethod,
                                  receiptNumber: latestPayment.receiptNumber || fee.receiptNumber,
                                  notes: latestPayment.notes
                                },
                                studentName,
                                user?.name
                              )
                            }}
                            >
                            {t('downloadReceipt')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Overdue Alert */}
        {stats && stats.overdueCount > 0 && (
          <Card className="mt-6 border-l-4 border-l-rose-500 bg-rose-50">
            <div className="flex items-start gap-4">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{t('overdueFeesAlert')}</h3>
                <p className="text-sm text-slate-600">
                  {studentName} {t('overdueFeesMessage')} {stats.overdueCount > 1 ? `${stats.overdueCount} ${t('overdueFeesMessagePlural')}` : `${stats.overdueCount} ${t('overdueFeesMessage')}`} {t('totaling')} {formatCurrency(stats.overdueAmount)}. 
                  {t('pleasePayAsap')}
                </p>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  // Find first overdue fee
                  const overdueFee = fees?.find(f => f.status === 'overdue')
                  if (overdueFee) {
                    setSelectedFee(overdueFee)
                    setShowPaymentModal(true)
                  }
                }}
              >
                Pay Now
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Modal */}
        {selectedFee && (
          <PaymentModal
            fee={selectedFee}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedFee(null)
            }}
            onSuccess={handlePaymentSuccess}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}

