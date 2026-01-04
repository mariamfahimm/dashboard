/**
 * User-Adaptive Dashboard Utilities
 * Manages user preferences, behavior tracking, and adaptive feature visibility
 */

import { getGradeModeFromLevel, getGradeModeConfig, type GradeMode, type GradeModeConfig } from './gradeModeUtils'

export type DashboardComplexity = 'basic' | 'standard' | 'advanced'

export interface UserBehavior {
  featureInteractions: Record<string, number> // feature key -> interaction count
  lastInteraction: Record<string, Date> // feature key -> last accessed date
  totalSessions: number
  averageSessionDuration: number
  preferredFeatures: string[] // Most frequently accessed features
  ignoredFeatures: string[] // Features that were collapsed/hidden
}

export interface UserDashboardPreferences {
  // Per-child preferences
  [studentId: string]: {
    // Initial baseline from grade
    gradeBaseline: GradeMode
    
    // User-selected complexity level
    complexityLevel: DashboardComplexity
    
    // Manual feature overrides (user explicitly enabled/disabled)
    featureOverrides: Record<string, boolean>
    
    // Behavioral adaptations (system-learned)
    behavioralAdaptations: {
      autoHideFeatures: string[] // Features to hide based on non-usage
      autoShowFeatures: string[] // Features to show based on frequent usage
    }
    
    // Advanced analytics toggle
    advancedAnalyticsEnabled: boolean
    
    // Last updated timestamp
    lastUpdated: Date
  }
}

export interface AdaptiveFeatureConfig {
  // Feature identifier
  key: string
  
  // Display name
  label: string
  
  // Description
  description: string
  
  // Whether it's an advanced feature
  isAdvanced: boolean
  
  // Default visibility based on grade mode
  defaultVisible: (gradeMode: GradeMode) => boolean
  
  // Minimum complexity level required
  minComplexity: DashboardComplexity
}

/**
 * Define all dashboard features with their adaptive properties
 */
export const DASHBOARD_FEATURES: AdaptiveFeatureConfig[] = [
  {
    key: 'predictiveForecasts',
    label: 'Predictive Forecasts',
    description: 'See predictions about your child\'s future performance',
    isAdvanced: true,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  },
  {
    key: 'subjectHeatmap',
    label: 'Subject Performance Overview',
    description: 'Visual overview showing how your child is doing in each subject',
    isAdvanced: false,
    defaultVisible: (mode) => mode !== 'early-primary',
    minComplexity: 'basic'
  },
  {
    key: 'trendCharts',
    label: 'Performance Trends',
    description: 'See how your child\'s performance changes over time',
    isAdvanced: false,
    defaultVisible: (mode) => mode !== 'early-primary',
    minComplexity: 'basic'
  },
  {
    key: 'goalsTracking',
    label: 'Goals Tracking',
    description: 'Track and monitor your child\'s academic goals',
    isAdvanced: false,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  },
  {
    key: 'earlyWarnings',
    label: 'At-Risk Warnings',
    description: 'Get early warnings if your child needs extra support',
    isAdvanced: false,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  },
  {
    key: 'examCountdown',
    label: 'Exam Countdown',
    description: 'See how many days until upcoming exams',
    isAdvanced: false,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  },
  {
    key: 'gpaSimulation',
    label: 'GPA Calculator',
    description: 'Calculate and see projected GPA for college planning',
    isAdvanced: true,
    defaultVisible: (mode) => mode === 'senior-school',
    minComplexity: 'advanced'
  },
  {
    key: 'universityReadiness',
    label: 'University Readiness',
    description: 'See how ready your child is for college',
    isAdvanced: true,
    defaultVisible: (mode) => mode === 'senior-school',
    minComplexity: 'advanced'
  },
  {
    key: 'detailedAnalytics',
    label: 'Detailed Analysis',
    description: 'Get in-depth analysis of your child\'s performance',
    isAdvanced: true,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  },
  {
    key: 'communicationTips',
    label: 'Communication Tips',
    description: 'Get tips on how to support and talk with your child',
    isAdvanced: false,
    defaultVisible: (mode) => mode === 'middle-school' || mode === 'senior-school',
    minComplexity: 'standard'
  }
]

/**
 * Get default complexity level based on grade mode
 */
export function getDefaultComplexity(gradeMode: GradeMode): DashboardComplexity {
  switch (gradeMode) {
    case 'early-primary':
      return 'basic'
    case 'upper-primary':
      return 'basic'
    case 'middle-school':
      return 'standard'
    case 'senior-school':
      return 'standard'
    default:
      return 'basic'
  }
}

/**
 * Determine if a feature should be visible based on adaptive rules
 */
export function shouldShowFeature(
  featureKey: string,
  preferences: UserDashboardPreferences[string] | undefined,
  gradeMode: GradeMode,
  behavior: UserBehavior | undefined
): boolean {
  const feature = DASHBOARD_FEATURES.find(f => f.key === featureKey)
  if (!feature) return false

  // 1. Check manual override (user explicitly set)
  if (preferences?.featureOverrides[featureKey] !== undefined) {
    return preferences.featureOverrides[featureKey]
  }

  // 2. Check behavioral adaptations (system-learned)
  if (preferences?.behavioralAdaptations) {
    if (preferences.behavioralAdaptations.autoHideFeatures.includes(featureKey)) {
      return false
    }
    if (preferences.behavioralAdaptations.autoShowFeatures.includes(featureKey)) {
      return true
    }
  }

  // 3. Check complexity level requirement
  const complexity = preferences?.complexityLevel || getDefaultComplexity(gradeMode)
  const complexityLevels: DashboardComplexity[] = ['basic', 'standard', 'advanced']
  const currentLevelIndex = complexityLevels.indexOf(complexity)
  const requiredLevelIndex = complexityLevels.indexOf(feature.minComplexity)
  
  if (currentLevelIndex < requiredLevelIndex) {
    return false
  }

  // 4. Check if advanced analytics is enabled (for advanced features)
  if (feature.isAdvanced && !preferences?.advancedAnalyticsEnabled) {
    return false
  }

  // 5. Check grade-based default
  return feature.defaultVisible(gradeMode)
}

/**
 * Get adaptive feature configuration for a student
 */
export function getAdaptiveConfig(
  studentId: string,
  gradeLevel: number,
  preferences: UserDashboardPreferences | undefined,
  behavior: UserBehavior | undefined
): {
  gradeMode: GradeMode
  gradeConfig: GradeModeConfig
  complexity: DashboardComplexity
  features: Record<string, boolean>
  showPercentages: boolean
  useSimpleLanguage: boolean
  heatmapColors: 3 | 5 | 'full'
  insightLength: 'sentence' | 'paragraph' | 'full'
} {
  const gradeMode = getGradeModeFromLevel(gradeLevel)
  const gradeConfig = getGradeModeConfig(gradeMode)
  const studentPrefs = preferences?.[studentId]
  const complexity = studentPrefs?.complexityLevel || getDefaultComplexity(gradeMode)

  // Build feature visibility map
  const features: Record<string, boolean> = {}
  DASHBOARD_FEATURES.forEach(feature => {
    features[feature.key] = shouldShowFeature(
      feature.key,
      studentPrefs,
      gradeMode,
      behavior
    )
  })

  // Determine display preferences based on complexity
  let showPercentages = gradeConfig.features.showPercentages
  let useSimpleLanguage = gradeConfig.features.useSimpleLanguage
  let heatmapColors = gradeConfig.features.heatmapColors
  let insightLength = gradeConfig.features.insightLength

  if (complexity === 'basic') {
    showPercentages = false
    useSimpleLanguage = true
    heatmapColors = 3
    insightLength = 'sentence'
  } else if (complexity === 'standard') {
    showPercentages = true
    useSimpleLanguage = false
    heatmapColors = 5
    insightLength = 'paragraph'
  } else if (complexity === 'advanced') {
    showPercentages = true
    useSimpleLanguage = false
    heatmapColors = 'full'
    insightLength = 'full'
  }

  return {
    gradeMode,
    gradeConfig,
    complexity,
    features,
    showPercentages,
    useSimpleLanguage,
    heatmapColors,
    insightLength
  }
}

/**
 * Track user interaction with a feature
 */
export function trackFeatureInteraction(
  behavior: UserBehavior,
  featureKey: string
): UserBehavior {
  const updated = { ...behavior }
  
  // Increment interaction count
  updated.featureInteractions = {
    ...updated.featureInteractions,
    [featureKey]: (updated.featureInteractions[featureKey] || 0) + 1
  }
  
  // Update last interaction time
  updated.lastInteraction = {
    ...updated.lastInteraction,
    [featureKey]: new Date()
  }
  
  // Update preferred features (top 5 most accessed)
  const sortedFeatures = Object.entries(updated.featureInteractions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key]) => key)
  updated.preferredFeatures = sortedFeatures
  
  return updated
}

/**
 * Analyze behavior to suggest adaptations
 */
export function analyzeBehaviorForAdaptations(
  behavior: UserBehavior,
  daysSinceLastInteraction: number = 7
): {
  autoHideFeatures: string[]
  autoShowFeatures: string[]
} {
  const autoHideFeatures: string[] = []
  const autoShowFeatures: string[] = []

  // Features that haven't been accessed in X days should be hidden
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastInteraction)

  DASHBOARD_FEATURES.forEach(feature => {
    const lastAccess = behavior.lastInteraction[feature.key]
    const interactionCount = behavior.featureInteractions[feature.key] || 0

    // Hide if never accessed or not accessed recently
    if (!lastAccess || lastAccess < cutoffDate) {
      if (interactionCount === 0 || (interactionCount < 3 && !lastAccess)) {
        autoHideFeatures.push(feature.key)
      }
    }

    // Show if frequently accessed
    if (interactionCount >= 5 && lastAccess && lastAccess >= cutoffDate) {
      autoShowFeatures.push(feature.key)
    }
  })

  return { autoHideFeatures, autoShowFeatures }
}

