/**
 * Grade Mode Utilities
 * Determines UI mode based on student grade level
 */

export type GradeMode = 'early-primary' | 'upper-primary' | 'middle-school' | 'senior-school'

export interface GradeModeConfig {
  mode: GradeMode
  label: string
  description: string
  features: {
    showPredictiveForecasts: boolean
    showHeatmaps: boolean
    showPercentages: boolean
    showDetailedAnalytics: boolean
    showAttendance: boolean
    showTeacherNotes: boolean
    showTodaysSchedule: boolean
    showSimpleIcons: boolean
    showAssignments: boolean
    showWeeklySnapshot: boolean
    showTrendCharts: boolean
    showEarlyWarnings: boolean
    showGoals: boolean
    showExamCountdown: boolean
    showGPASimulation: boolean
    showUniversityReadiness: boolean
    useSimpleLanguage: boolean
    useEmotionalWording: boolean
    showCommunicationTips: boolean
    heatmapColors: 3 | 5 | 'full'
    insightLength: 'sentence' | 'paragraph' | 'full'
  }
}

/**
 * Determine grade mode from grade level
 */
export function getGradeModeFromLevel(gradeLevel: number): GradeMode {
  if (gradeLevel >= 1 && gradeLevel <= 3) {
    return 'early-primary'
  } else if (gradeLevel >= 4 && gradeLevel <= 6) {
    return 'upper-primary'
  } else if (gradeLevel >= 7 && gradeLevel <= 9) {
    return 'middle-school'
  } else if (gradeLevel >= 10 && gradeLevel <= 12) {
    return 'senior-school'
  }
  // Default to upper primary if grade level is outside expected range
  return 'upper-primary'
}

/**
 * Get grade mode configuration
 */
export function getGradeModeConfig(mode: GradeMode): GradeModeConfig {
  const configs: Record<GradeMode, GradeModeConfig> = {
    'early-primary': {
      mode: 'early-primary',
      label: 'Early Primary',
      description: 'Grades 1-3: Focus on basics, attendance, and simple progress',
      features: {
        showPredictiveForecasts: false,
        showHeatmaps: false,
        showPercentages: false,
        showDetailedAnalytics: false,
        showAttendance: true,
        showTeacherNotes: true,
        showTodaysSchedule: true,
        showSimpleIcons: true,
        showAssignments: true,
        showWeeklySnapshot: true,
        showTrendCharts: false,
        showEarlyWarnings: false,
        showGoals: false,
        showExamCountdown: false,
        showGPASimulation: false,
        showUniversityReadiness: false,
        useSimpleLanguage: true,
        useEmotionalWording: false,
        showCommunicationTips: false,
        heatmapColors: 3,
        insightLength: 'sentence'
      }
    },
    'upper-primary': {
      mode: 'upper-primary',
      label: 'Upper Primary',
      description: 'Grades 4-6: Introduction to trends and simple analytics',
      features: {
        showPredictiveForecasts: false,
        showHeatmaps: true,
        showPercentages: true,
        showDetailedAnalytics: false,
        showAttendance: true,
        showTeacherNotes: true,
        showTodaysSchedule: true,
        showSimpleIcons: true,
        showAssignments: true,
        showWeeklySnapshot: true,
        showTrendCharts: true,
        showEarlyWarnings: false,
        showGoals: false,
        showExamCountdown: false,
        showGPASimulation: false,
        showUniversityReadiness: false,
        useSimpleLanguage: true,
        useEmotionalWording: false,
        showCommunicationTips: false,
        heatmapColors: 3,
        insightLength: 'sentence'
      }
    },
    'middle-school': {
      mode: 'middle-school',
      label: 'Middle School',
      description: 'Grades 7-9: Advanced analytics with emotional support',
      features: {
        showPredictiveForecasts: true,
        showHeatmaps: true,
        showPercentages: true,
        showDetailedAnalytics: true,
        showAttendance: true,
        showTeacherNotes: true,
        showTodaysSchedule: true,
        showSimpleIcons: false,
        showAssignments: true,
        showWeeklySnapshot: true,
        showTrendCharts: true,
        showEarlyWarnings: true,
        showGoals: true,
        showExamCountdown: true,
        showGPASimulation: false,
        showUniversityReadiness: false,
        useSimpleLanguage: false,
        useEmotionalWording: true,
        showCommunicationTips: true,
        heatmapColors: 5,
        insightLength: 'paragraph'
      }
    },
    'senior-school': {
      mode: 'senior-school',
      label: 'Senior School',
      description: 'Grades 10-12: Full analytics, forecasts, and university prep',
      features: {
        showPredictiveForecasts: true,
        showHeatmaps: true,
        showPercentages: true,
        showDetailedAnalytics: true,
        showAttendance: true,
        showTeacherNotes: true,
        showTodaysSchedule: true,
        showSimpleIcons: false,
        showAssignments: true,
        showWeeklySnapshot: true,
        showTrendCharts: true,
        showEarlyWarnings: true,
        showGoals: true,
        showExamCountdown: true,
        showGPASimulation: true,
        showUniversityReadiness: true,
        useSimpleLanguage: false,
        useEmotionalWording: true,
        showCommunicationTips: true,
        heatmapColors: 'full',
        insightLength: 'full'
      }
    }
  }

  return configs[mode]
}

/**
 * Get simplified progress phrase for early primary mode
 */
export function getSimpleProgressPhrase(percentage: number): string {
  if (percentage >= 90) return 'Excellent work!'
  if (percentage >= 80) return 'Doing very well!'
  if (percentage >= 70) return 'Good progress!'
  if (percentage >= 60) return 'Keep trying!'
  return 'Needs support'
}

/**
 * Format percentage based on grade mode
 */
export function formatPercentage(percentage: number, gradeMode: GradeMode): string {
  if (gradeMode === 'early-primary') {
    // Early Primary: No percentages shown (should use getSimpleProgressPhrase instead)
    return getSimpleProgressPhrase(percentage)
  } else if (gradeMode === 'upper-primary') {
    // Upper Primary: 1 decimal place
    return `${percentage.toFixed(1)}%`
  } else {
    // Middle/Senior School: Full precision (2 decimals)
    return `${percentage.toFixed(2)}%`
  }
}

/**
 * Format percentage number (for use in calculations where we just need the formatted string)
 */
export function formatPercentageNumber(percentage: number, showDecimals: number = 2): string {
  return `${percentage.toFixed(showDecimals)}%`
}

/**
 * Get confidence label in plain language
 */
export function getConfidenceLabel(confidence: number): {
  label: string
  color: string
  description: string
} {
  if (confidence >= 0.75) {
    return {
      label: 'High confidence',
      color: 'text-green-600',
      description: 'Based on strong patterns in your child\'s data'
    }
  } else if (confidence >= 0.5) {
    return {
      label: 'Medium confidence',
      color: 'text-amber-600',
      description: 'Based on some patterns, but could change'
    }
  } else {
    return {
      label: 'Low confidence',
      color: 'text-slate-600',
      description: 'Limited data available, use as general guidance'
    }
  }
}

