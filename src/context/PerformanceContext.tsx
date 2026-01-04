// Performance Context
import React, { createContext, useContext, ReactNode } from 'react'
import { usePerformance } from '@/hooks/usePerformance'
import type { PerformanceMetrics, PerformanceInsight } from '@/services/performanceService'

interface PerformanceContextType {
  metrics: PerformanceMetrics | null
  insights: PerformanceInsight[]
  riskScore: number | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

interface PerformanceProviderProps {
  children: ReactNode
  studentId: string
}

export function PerformanceProvider({ children, studentId }: PerformanceProviderProps) {
  const performance = usePerformance(studentId)

  return (
    <PerformanceContext.Provider value={performance}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider')
  }
  return context
}

