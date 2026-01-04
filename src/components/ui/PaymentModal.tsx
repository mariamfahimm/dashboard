// Payment Modal Component
import React, { useState } from 'react'
import { Button } from './Button'
import type { Fee } from '../../services/api/feesApi'

interface PaymentModalProps {
  fee: Fee
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  t: (key: string) => string
  locale: string
}

export function PaymentModal({ fee, isOpen, onClose, onSuccess, t, locale }: PaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer' | 'online' | 'card'>('online')
  const [receiptNumber, setReceiptNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingBalance = fee.amount - fee.paidAmount

  React.useEffect(() => {
    if (isOpen) {
      // Set default amount to remaining balance
      setAmount(remainingBalance.toFixed(2))
      setError(null)
    }
  }, [isOpen, remainingBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const paymentAmount = parseFloat(amount)
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError(t('pleaseEnterValidPaymentAmount'))
      return
    }

    if (paymentAmount > remainingBalance) {
      setError(t('paymentAmountCannotExceed')?.replace('{amount}', `E£${remainingBalance.toFixed(2)}`) || `Payment amount cannot exceed remaining balance of E£${remainingBalance.toFixed(2)}`)
      return
    }

    if (paymentAmount < 0.01) {
      setError(t('paymentAmountMinimum'))
      return
    }

    setLoading(true)
    try {
      const { feesApi } = await import('../../services/api/feesApi')
      
      await feesApi.recordPayment(fee._id, {
        amount: paymentAmount,
        paymentMethod,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined
      })

      // Reset form
      setAmount('')
      setReceiptNumber('')
      setNotes('')
      
      // Close modal and refresh data
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || t('failedToRecordPayment'))
    } finally {
      setLoading(false)
    }
  }

  const handleFullPayment = () => {
    setAmount(remainingBalance.toFixed(2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">{t('recordPayment')}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">{fee.description}</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* Fee Details */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t('totalAmount')}:</span>
              <span className="font-semibold text-slate-900">E£{fee.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{t('alreadyPaid')}:</span>
              <span className="font-semibold text-emerald-600">E£{fee.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="text-slate-700 font-medium">{t('remainingBalance')}:</span>
              <span className="font-bold text-slate-900">E£{remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('paymentAmount')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                placeholder="0.00"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFullPayment}
                disabled={loading}
              >
                {t('payFull')}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('maximum')}: E£{remainingBalance.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('paymentMethod')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              required
              disabled={loading}
            >
              <option value="online">{t('onlinePayment')}</option>
              <option value="bank_transfer">{t('bankTransfer')}</option>
              <option value="card">{t('card')}</option>
              <option value="cash">{t('cash')}</option>
              <option value="check">{t('check')}</option>
            </select>
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('receiptNumber')} ({t('optional')})
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              placeholder={t('enterReceiptNumber')}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('notes')} ({t('optional')})
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              placeholder={t('addAdditionalNotes')}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? t('processing') : t('recordPayment')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

