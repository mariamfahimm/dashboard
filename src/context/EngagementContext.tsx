// Engagement Context
import React, { createContext, useContext, ReactNode } from 'react'
import { useEngagement } from '@/hooks/useEngagement'
import type { EngagementMetrics, EngagementPrediction } from '@/services/engagementService'

interface EngagementContextType {
  metrics: EngagementMetrics | null
  predictions: {
    daily: EngagementPrediction | null
    weekly: EngagementPrediction | null
    monthly: EngagementPrediction | null
  }
  insights: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined)

interface EngagementProviderProps {
  children: ReactNode
  studentId: string
}

export function EngagementProvider({ children, studentId }: EngagementProviderProps) {
  const engagement = useEngagement(studentId)

  return (
    <EngagementContext.Provider value={engagement}>
      {children}
    </EngagementContext.Provider>
  )
}

export function useEngagementContext() {
  const context = useContext(EngagementContext)
  if (context === undefined) {
    throw new Error('useEngagementContext must be used within an EngagementProvider')
  }
  return context
}

