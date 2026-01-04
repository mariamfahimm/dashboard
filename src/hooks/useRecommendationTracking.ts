// Hook to track which recommendations have been seen/completed by parents
import { useState, useEffect, useCallback } from 'react'

interface RecommendationTracking {
  [studentId: string]: {
    [recommendationKey: string]: {
      seen: boolean
      completed: boolean
      completedAt?: string
    }
  }
}

// Generate a unique key for a recommendation
function getRecommendationKey(recommendation: { type: string; title: string; relatedSubject?: string }): string {
  return `${recommendation.type}-${recommendation.title}-${recommendation.relatedSubject || ''}`
}

export function useRecommendationTracking(studentId?: string) {
  const [tracking, setTracking] = useState<RecommendationTracking>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem('recommendationTracking')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Save to localStorage whenever tracking changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('recommendationTracking', JSON.stringify(tracking))
      } catch (error) {
        console.error('Error saving recommendation tracking:', error)
      }
    }
  }, [tracking])

  const markAsSeen = useCallback((recommendation: { type: string; title: string; relatedSubject?: string }) => {
    if (!studentId) return

    setTracking(prev => {
      const key = getRecommendationKey(recommendation)
      const studentTracking = prev[studentId] || {}
      
      return {
        ...prev,
        [studentId]: {
          ...studentTracking,
          [key]: {
            ...studentTracking[key],
            seen: true
          }
        }
      }
    })
  }, [studentId])

  const markAsCompleted = useCallback((recommendation: { type: string; title: string; relatedSubject?: string }, completed: boolean) => {
    if (!studentId) {
      console.warn('markAsCompleted: No studentId provided')
      return
    }

    const key = getRecommendationKey(recommendation)
    console.log('markAsCompleted:', { studentId, key, completed, recommendation })

    setTracking(prev => {
      const studentTracking = prev[studentId] || {}
      const existingKey = studentTracking[key] || { seen: false, completed: false }
      
      // Only update if the value actually changed
      if (existingKey.completed === completed) {
        console.log('State unchanged, skipping update')
        return prev
      }
      
      const newTracking = {
        ...prev,
        [studentId]: {
          ...studentTracking,
          [key]: {
            ...existingKey,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined
          }
        }
      }
      
      console.log('New tracking state:', newTracking)
      return newTracking
    })
  }, [studentId])

  const getTrackingStatus = useCallback((recommendation: { type: string; title: string; relatedSubject?: string }) => {
    if (!studentId) return { seen: false, completed: false }

    const key = getRecommendationKey(recommendation)
    // Access tracking from state directly (will be current on each render)
    const currentTracking = tracking[studentId] || {}
    return currentTracking[key] || { seen: false, completed: false }
  }, [studentId, tracking])

  const clearTracking = useCallback(() => {
    if (!studentId) return

    setTracking(prev => {
      const newTracking = { ...prev }
      delete newTracking[studentId]
      return newTracking
    })
  }, [studentId])

  return {
    markAsSeen,
    markAsCompleted,
    getTrackingStatus,
    clearTracking
  }
}

