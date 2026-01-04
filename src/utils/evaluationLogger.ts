/**
 * Evaluation Logger
 * Logs user interactions and adaptive system decisions for thesis evaluation
 */

export interface EvaluationEvent {
  timestamp: Date
  eventType: 'feature_enabled' | 'feature_disabled' | 'complexity_changed' | 'feature_interaction' | 'adaptive_change' | 'settings_opened' | 'reset_to_defaults'
  studentId?: string
  userId?: string
  data: {
    featureKey?: string
    complexity?: 'basic' | 'standard' | 'advanced'
    reason?: string
    previousValue?: any
    newValue?: any
    source?: 'manual' | 'behavioral' | 'default'
  }
}

class EvaluationLogger {
  private events: EvaluationEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events

  log(event: Omit<EvaluationEvent, 'timestamp'>) {
    const fullEvent: EvaluationEvent = {
      ...event,
      timestamp: new Date()
    }
    
    this.events.push(fullEvent)
    
    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Also log to console in development (with human-readable feature names)
    if (process.env.NODE_ENV === 'development') {
      const readableEvent = { ...fullEvent }
      // Convert feature keys to readable names for console
      if (readableEvent.data.featureKey) {
        const featureMap: Record<string, string> = {
          'predictiveForecasts': 'Predictive Forecasts',
          'subjectHeatmap': 'Subject Heatmap',
          'trendCharts': 'Trend Charts',
          'goalsTracking': 'Goals Tracking',
          'earlyWarnings': 'At-Risk Warnings',
          'examCountdown': 'Exam Countdown',
          'gpaSimulation': 'GPA Simulation',
          'universityReadiness': 'University Readiness',
          'detailedAnalytics': 'Detailed Analytics',
          'communicationTips': 'Communication Guidance'
        }
        readableEvent.data.featureName = featureMap[readableEvent.data.featureKey] || readableEvent.data.featureKey
      }
      console.log('[Evaluation]', readableEvent)
    }

    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem('educonnect_evaluation_logs')
      const logs = stored ? JSON.parse(stored) : []
      logs.push(fullEvent)
      // Keep only last 500 in localStorage
      const recentLogs = logs.slice(-500)
      localStorage.setItem('educonnect_evaluation_logs', JSON.stringify(recentLogs))
    } catch (error) {
      console.error('Error storing evaluation log:', error)
    }
  }

  getEvents(): EvaluationEvent[] {
    return [...this.events]
  }

  getEventsByType(eventType: EvaluationEvent['eventType']): EvaluationEvent[] {
    return this.events.filter(e => e.eventType === eventType)
  }

  getEventsForStudent(studentId: string): EvaluationEvent[] {
    return this.events.filter(e => e.studentId === studentId)
  }

  exportForEvaluation(): {
    summary: {
      totalEvents: number
      featureEnables: number
      featureDisables: number
      complexityChanges: number
      featureInteractions: number
      adaptiveChanges: number
    }
    events: EvaluationEvent[]
    featureUsage: Record<string, number>
    complexityDistribution: Record<string, number>
  } {
    const featureUsage: Record<string, number> = {}
    const complexityDistribution: Record<string, number> = {}

    this.events.forEach(event => {
      if (event.data.featureKey) {
        featureUsage[event.data.featureKey] = (featureUsage[event.data.featureKey] || 0) + 1
      }
      if (event.data.complexity) {
        complexityDistribution[event.data.complexity] = (complexityDistribution[event.data.complexity] || 0) + 1
      }
    })

    return {
      summary: {
        totalEvents: this.events.length,
        featureEnables: this.getEventsByType('feature_enabled').length,
        featureDisables: this.getEventsByType('feature_disabled').length,
        complexityChanges: this.getEventsByType('complexity_changed').length,
        featureInteractions: this.getEventsByType('feature_interaction').length,
        adaptiveChanges: this.getEventsByType('adaptive_change').length
      },
      events: this.events,
      featureUsage,
      complexityDistribution
    }
  }

  clear() {
    this.events = []
    localStorage.removeItem('educonnect_evaluation_logs')
  }
}

export const evaluationLogger = new EvaluationLogger()

