// Fees/Payments API Service
import { apiClient } from '../../utils/apiClient'

export interface Fee {
  _id: string
  studentId: string
  feeType: 'tuition' | 'activity' | 'transport' | 'library' | 'technology' | 'other'
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'waived' | 'partial'
  paidAmount: number
  paidDate?: string
  paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online' | 'card'
  receiptNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FeeStats {
  totalFees: number
  totalAmount: number
  totalPaid: number
  totalPending: number
  overdueCount: number
  overdueAmount: number
  pendingCount: number
  paidCount: number
}

export interface FeeQueryParams {
  status?: 'pending' | 'paid' | 'overdue' | 'waived' | 'partial'
  feeType?: 'tuition' | 'activity' | 'transport' | 'library' | 'technology' | 'other'
  startDate?: string
  endDate?: string
}

export const feesApi = {
  /**
   * Get fees for a student
   */
  getByStudent: (studentId: string, params?: FeeQueryParams) => {
    return apiClient.get<{
      success: boolean
      count: number
      data: Fee[]
    }>(`/fees/${studentId}`, params)
  },

  /**
   * Get fee statistics for a student
   */
  getStats: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      data: FeeStats
    }>(`/fees/${studentId}/stats`)
  },

  /**
   * Get payment history for a student
   */
  getPaymentHistory: (studentId: string) => {
    return apiClient.get<{
      success: boolean
      count: number
      data: Fee[]
    }>(`/fees/${studentId}/history`)
  },

  /**
   * Create a new fee
   */
  create: (data: {
    studentId: string
    feeType: 'tuition' | 'activity' | 'transport' | 'library' | 'technology' | 'other'
    description: string
    amount: number
    dueDate: string
    notes?: string
  }) => {
    return apiClient.post<{
      success: boolean
      data: Fee
      message: string
    }>('/fees', data)
  },

  /**
   * Update a fee
   */
  update: (feeId: string, data: Partial<Fee>) => {
    return apiClient.put<{
      success: boolean
      data: Fee
      message: string
    }>(`/fees/${feeId}`, data)
  },

  /**
   * Record a payment
   */
  recordPayment: (feeId: string, data: {
    amount: number
    paymentMethod?: 'cash' | 'check' | 'bank_transfer' | 'online' | 'card'
    receiptNumber?: string
    notes?: string
  }) => {
    return apiClient.post<{
      success: boolean
      data: Fee
      message: string
    }>(`/fees/${feeId}/pay`, data)
  },

  /**
   * Delete a fee
   */
  delete: (feeId: string) => {
    return apiClient.delete<{
      success: boolean
      message: string
    }>(`/fees/${feeId}`)
  }
}

