/**
 * User-Adaptive Dashboard Context
 * Manages user preferences, behavior tracking, and adaptive feature visibility
 * Replaces/enhances GradeModeContext with user-centered adaptivity
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  getGradeModeFromLevel,
  type GradeMode,
  type GradeModeConfig
} from '../utils/gradeModeUtils'
import {
  type UserDashboardPreferences,
  type UserBehavior,
  type DashboardComplexity,
  getDefaultComplexity,
  getAdaptiveConfig,
  trackFeatureInteraction,
  analyzeBehaviorForAdaptations,
  DASHBOARD_FEATURES
} from '../utils/userAdaptiveUtils'
import { evaluationLogger } from '../utils/evaluationLogger'

interface AdaptiveConfig {
  gradeMode: GradeMode
  gradeConfig: GradeModeConfig
  complexity: DashboardComplexity
  features: Record<string, boolean>
  showPercentages: boolean
  useSimpleLanguage: boolean
  heatmapColors: 3 | 5 | 'full'
  insightLength: 'sentence' | 'paragraph' | 'full'
}

interface UserAdaptiveContextType {
  // Get adaptive configuration for a student
  getAdaptiveConfig: (studentId: string, gradeLevel: number) => AdaptiveConfig
  
  // User preferences management
  setComplexity: (studentId: string, complexity: DashboardComplexity) => void
  setFeatureOverride: (studentId: string, featureKey: string, enabled: boolean) => void
  setAdvancedAnalytics: (studentId: string, enabled: boolean) => void
  resetToDefaults: (studentId: string, gradeLevel: number) => void
  
  // Behavior tracking
  trackInteraction: (studentId: string, featureKey: string) => void
  
  // Get current preferences
  getPreferences: (studentId: string) => UserDashboardPreferences[string] | undefined
  
  // Get behavior data
  getBehavior: (studentId: string) => UserBehavior | undefined
}

const UserAdaptiveContext = createContext<UserAdaptiveContextType | undefined>(undefined)

const STORAGE_KEY_PREFS = 'educonnect_user_preferences'
const STORAGE_KEY_BEHAVIOR = 'educonnect_user_behavior'

export function UserAdaptiveProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<UserDashboardPreferences>({})
  const [behavior, setBehavior] = useState<Record<string, UserBehavior>>({})
  const sessionStartTime = useRef<Date>(new Date())

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS)
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs) as UserDashboardPreferences
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(studentId => {
          if (parsed[studentId].lastUpdated) {
            parsed[studentId].lastUpdated = new Date(parsed[studentId].lastUpdated as any)
          }
        })
        setPreferences(parsed)
      }

      const storedBehavior = localStorage.getItem(STORAGE_KEY_BEHAVIOR)
      if (storedBehavior) {
        const parsed = JSON.parse(storedBehavior) as Record<string, UserBehavior>
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(studentId => {
          if (parsed[studentId].lastInteraction) {
            Object.keys(parsed[studentId].lastInteraction).forEach(featureKey => {
              parsed[studentId].lastInteraction[featureKey] = new Date(
                parsed[studentId].lastInteraction[featureKey] as any
              )
            })
          }
        })
        setBehavior(parsed)
      }
    } catch (error) {
      console.error('Error loading user adaptive data from localStorage:', error)
    }
  }, [])

  // Save to localStorage when preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error)
    }
  }, [preferences])

  // Save to localStorage when behavior changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(behavior))
    } catch (error) {
      console.error('Error saving behavior to localStorage:', error)
    }
  }, [behavior])

  // Periodically analyze behavior and update adaptations (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(behavior).forEach(studentId => {
        const studentBehavior = behavior[studentId]
        if (studentBehavior) {
          const adaptations = analyzeBehaviorForAdaptations(studentBehavior, 7)
          
          // Log adaptive changes
          const previousAdaptations = preferences[studentId]?.behavioralAdaptations
          if (previousAdaptations) {
            const changedFeatures = [
              ...adaptations.autoHideFeatures.filter(f => !previousAdaptations.autoHideFeatures.includes(f)),
              ...adaptations.autoShowFeatures.filter(f => !previousAdaptations.autoShowFeatures.includes(f))
            ]
            
            changedFeatures.forEach(featureKey => {
              evaluationLogger.log({
                eventType: 'adaptive_change',
                studentId,
                data: {
                  featureKey,
                  reason: adaptations.autoHideFeatures.includes(featureKey) ? 'auto_hide' : 'auto_show',
                  source: 'behavioral'
                }
              })
            })
          }
          
          setPreferences(prev => {
            const studentPrefs = prev[studentId]
            if (!studentPrefs) return prev

            return {
              ...prev,
              [studentId]: {
                ...studentPrefs,
                behavioralAdaptations: adaptations,
                lastUpdated: new Date()
              }
            }
          })
        }
      })
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [behavior, preferences])

  // Track session duration on unmount
  useEffect(() => {
    return () => {
      const sessionDuration = (new Date().getTime() - sessionStartTime.current.getTime()) / 1000 / 60 // minutes
      // Update average session duration for all students
      setBehavior(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(studentId => {
          const current = updated[studentId]
          if (current) {
            const totalSessions = current.totalSessions + 1
            updated[studentId] = {
              ...current,
              totalSessions,
              averageSessionDuration: (current.averageSessionDuration * current.totalSessions + sessionDuration) / totalSessions
            }
          }
        })
        return updated
      })
    }
  }, [])

  const getAdaptiveConfigForStudent = useCallback((studentId: string, gradeLevel: number): AdaptiveConfig => {
    const studentPrefs = preferences[studentId]
    const studentBehavior = behavior[studentId]
    
    return getAdaptiveConfig(studentId, gradeLevel, preferences, studentBehavior)
  }, [preferences, behavior])

  const setComplexityForStudent = useCallback((studentId: string, complexity: DashboardComplexity) => {
    setPreferences(prev => {
      const current = prev[studentId]
      const gradeMode = current?.gradeBaseline || getGradeModeFromLevel(5) // Default fallback
      const previousComplexity = current?.complexityLevel || getDefaultComplexity(gradeMode)
      
      // Log evaluation event
      evaluationLogger.log({
        eventType: 'complexity_changed',
        studentId,
        data: {
          complexity,
          previousValue: previousComplexity,
          newValue: complexity,
          source: 'manual'
        }
      })
      
      return {
        ...prev,
        [studentId]: {
          gradeBaseline: current?.gradeBaseline || gradeMode,
          complexityLevel: complexity,
          featureOverrides: current?.featureOverrides || {},
          behavioralAdaptations: current?.behavioralAdaptations || {
            autoHideFeatures: [],
            autoShowFeatures: []
          },
          advancedAnalyticsEnabled: current?.advancedAnalyticsEnabled || false,
          lastUpdated: new Date()
        }
      }
    })
  }, [])

  const setFeatureOverrideForStudent = useCallback((studentId: string, featureKey: string, enabled: boolean) => {
    setPreferences(prev => {
      const current = prev[studentId]
      const gradeMode = current?.gradeBaseline || getGradeModeFromLevel(5)
      const previousValue = current?.featureOverrides[featureKey]
      
      // Log evaluation event
      evaluationLogger.log({
        eventType: enabled ? 'feature_enabled' : 'feature_disabled',
        studentId,
        data: {
          featureKey,
          previousValue,
          newValue: enabled,
          source: 'manual'
        }
      })
      
      return {
        ...prev,
        [studentId]: {
          gradeBaseline: current?.gradeBaseline || gradeMode,
          complexityLevel: current?.complexityLevel || getDefaultComplexity(gradeMode),
          featureOverrides: {
            ...(current?.featureOverrides || {}),
            [featureKey]: enabled
          },
          behavioralAdaptations: current?.behavioralAdaptations || {
            autoHideFeatures: [],
            autoShowFeatures: []
          },
          advancedAnalyticsEnabled: current?.advancedAnalyticsEnabled || false,
          lastUpdated: new Date()
        }
      }
    })
  }, [])

  const setAdvancedAnalyticsForStudent = useCallback((studentId: string, enabled: boolean) => {
    setPreferences(prev => {
      const current = prev[studentId]
      const gradeMode = current?.gradeBaseline || getGradeModeFromLevel(5)
      
      return {
        ...prev,
        [studentId]: {
          gradeBaseline: current?.gradeBaseline || gradeMode,
          complexityLevel: current?.complexityLevel || getDefaultComplexity(gradeMode),
          featureOverrides: current?.featureOverrides || {},
          behavioralAdaptations: current?.behavioralAdaptations || {
            autoHideFeatures: [],
            autoShowFeatures: []
          },
          advancedAnalyticsEnabled: enabled,
          lastUpdated: new Date()
        }
      }
    })
  }, [])

  const resetToDefaultsForStudent = useCallback((studentId: string, gradeLevel: number) => {
    const gradeMode = getGradeModeFromLevel(gradeLevel)
    
    // Log evaluation event
    evaluationLogger.log({
      eventType: 'reset_to_defaults',
      studentId,
      data: {
        complexity: getDefaultComplexity(gradeMode),
        source: 'manual'
      }
    })
    
    setPreferences(prev => ({
      ...prev,
      [studentId]: {
        gradeBaseline: gradeMode,
        complexityLevel: getDefaultComplexity(gradeMode),
        featureOverrides: {},
        behavioralAdaptations: {
          autoHideFeatures: [],
          autoShowFeatures: []
        },
        advancedAnalyticsEnabled: false,
        lastUpdated: new Date()
      }
    }))
  }, [])

  const trackInteractionForStudent = useCallback((studentId: string, featureKey: string) => {
    setBehavior(prev => {
      const current = prev[studentId] || {
        featureInteractions: {},
        lastInteraction: {},
        totalSessions: 0,
        averageSessionDuration: 0,
        preferredFeatures: [],
        ignoredFeatures: []
      }
      
      // Log evaluation event
      evaluationLogger.log({
        eventType: 'feature_interaction',
        studentId,
        data: {
          featureKey,
          source: 'behavioral'
        }
      })
      
      return {
        ...prev,
        [studentId]: trackFeatureInteraction(current, featureKey)
      }
    })
  }, [])

  const getPreferencesForStudent = useCallback((studentId: string) => {
    return preferences[studentId]
  }, [preferences])

  const getBehaviorForStudent = useCallback((studentId: string) => {
    return behavior[studentId]
  }, [behavior])

  return (
    <UserAdaptiveContext.Provider
      value={{
        getAdaptiveConfig: getAdaptiveConfigForStudent,
        setComplexity: setComplexityForStudent,
        setFeatureOverride: setFeatureOverrideForStudent,
        setAdvancedAnalytics: setAdvancedAnalyticsForStudent,
        resetToDefaults: resetToDefaultsForStudent,
        trackInteraction: trackInteractionForStudent,
        getPreferences: getPreferencesForStudent,
        getBehavior: getBehaviorForStudent
      }}
    >
      {children}
    </UserAdaptiveContext.Provider>
  )
}

export function useUserAdaptive(studentId?: string, gradeLevel?: number) {
  const context = useContext(UserAdaptiveContext)
  if (!context) {
    throw new Error('useUserAdaptive must be used within UserAdaptiveProvider')
  }

  if (!studentId || gradeLevel === undefined) {
    // Return default config
    const defaultGradeMode = getGradeModeFromLevel(5)
    const defaultComplexity = getDefaultComplexity(defaultGradeMode)
    return {
      config: {
        gradeMode: defaultGradeMode,
        gradeConfig: {} as GradeModeConfig,
        complexity: defaultComplexity,
        features: {},
        showPercentages: false,
        useSimpleLanguage: true,
        heatmapColors: 3 as const,
        insightLength: 'sentence' as const
      },
      trackInteraction: () => {},
      setComplexity: () => {},
      setFeatureOverride: () => {},
      setAdvancedAnalytics: () => {},
      resetToDefaults: () => {},
      preferences: undefined,
      behavior: undefined
    }
  }

  const config = context.getAdaptiveConfig(studentId, gradeLevel)
  const preferences = context.getPreferences(studentId)
  const behaviorData = context.getBehavior(studentId)

  return {
    config,
    trackInteraction: (featureKey: string) => context.trackInteraction(studentId, featureKey),
    setComplexity: (complexity: DashboardComplexity) => context.setComplexity(studentId, complexity),
    setFeatureOverride: (featureKey: string, enabled: boolean) => 
      context.setFeatureOverride(studentId, featureKey, enabled),
    setAdvancedAnalytics: (enabled: boolean) => context.setAdvancedAnalytics(studentId, enabled),
    resetToDefaults: () => context.resetToDefaults(studentId, gradeLevel),
    preferences,
    behavior: behaviorData
  }
}

