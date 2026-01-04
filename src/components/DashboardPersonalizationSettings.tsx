/**
 * Dashboard Personalization Settings Component
 * Allows parents to customize dashboard complexity, features, and advanced analytics
 */
import React, { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useUserAdaptive } from '../context/UserAdaptiveContext'
import { DASHBOARD_FEATURES, type DashboardComplexity } from '../utils/userAdaptiveUtils'
import { getGradeModeConfig, type GradeMode } from '../utils/gradeModeUtils'
import { useReplayOnboarding } from '../components/ui/DashboardOnboarding'

interface DashboardPersonalizationSettingsProps {
  studentId: string
  gradeLevel: number
  t: (key: string) => string
}

export function DashboardPersonalizationSettings({
  studentId,
  gradeLevel,
  t
}: DashboardPersonalizationSettingsProps) {
  const {
    config,
    setComplexity,
    setFeatureOverride,
    setAdvancedAnalytics,
    resetToDefaults,
    preferences,
    behavior
  } = useUserAdaptive(studentId, gradeLevel)
  
  const { replayOnboarding } = useReplayOnboarding()

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleComplexityChange = (complexity: DashboardComplexity) => {
    setComplexity(complexity)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setFeatureOverride(featureKey, enabled)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleAdvancedAnalyticsToggle = (enabled: boolean) => {
    setAdvancedAnalytics(enabled)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleReset = () => {
    if (confirm('Reset dashboard to default settings based on grade level? This will clear all your customizations.')) {
      resetToDefaults()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const complexityLevels: { value: DashboardComplexity; label: string; description: string; parentFriendly: string }[] = [
    {
      value: 'basic',
      label: 'Simple View',
      description: 'High-level KPIs only, minimal charts, simple language',
      parentFriendly: 'See the essentials only. Perfect if you want a quick overview without too much detail.'
    },
    {
      value: 'standard',
      label: 'Standard View',
      description: 'KPIs + short trends, limited explanations',
      parentFriendly: 'See key information and trends. Good balance of detail and simplicity.'
    },
    {
      value: 'advanced',
      label: 'Detailed View',
      description: 'Detailed charts, forecasts, historical and predictive data',
      parentFriendly: 'See everything including predictions and detailed analysis. Best if you want all available information.'
    }
  ]

  const gradeConfig = getGradeModeConfig(config.gradeMode)
  const isDefault = !preferences || (
    preferences.complexityLevel === config.complexity &&
    Object.keys(preferences.featureOverrides).length === 0 &&
    !preferences.advancedAnalyticsEnabled
  )

  return (
    <div className="space-y-6">
      {/* Current Configuration Info */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold text-blue-900">
              Current Configuration: {complexityLevels.find(c => c.value === config.complexity)?.label}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              Grade Baseline: {gradeConfig.label} (Grade {gradeLevel})
              {!isDefault && ' • Customized'}
            </div>
          </div>
          {!isDefault && <Badge variant="warning">Customized</Badge>}
        </div>
        <div className="text-xs text-blue-600 mt-2">
          The dashboard adapts to your preferences while using your child's grade level as a starting point.
          {behavior && behavior.totalSessions > 0 && (
            <span className="ml-2">
              Based on {behavior.totalSessions} session{behavior.totalSessions !== 1 ? 's' : ''} of usage.
            </span>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Complexity Level Selection */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">How much detail do you want to see?</h3>
        <p className="text-sm text-slate-600 mb-4">
          Choose how much information appears on your dashboard. You can change this anytime.
        </p>
        <div className="space-y-3">
          {complexityLevels.map(level => (
            <label
              key={level.value}
              className="flex items-start p-4 rounded-xl border-2 cursor-pointer hover:bg-slate-50 transition-colors"
              style={{
                borderColor: config.complexity === level.value ? '#5C7CF7' : '#e2e8f0',
                backgroundColor: config.complexity === level.value ? '#f0f4ff' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="complexity"
                value={level.value}
                checked={config.complexity === level.value}
                onChange={() => handleComplexityChange(level.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 mb-1">{level.label}</div>
                <div className="text-sm text-slate-600">{level.parentFriendly}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Analytics Toggle */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Predictions and Future Insights</h3>
        <p className="text-sm text-slate-600 mb-4">
          Enable this to see predictions about your child's future performance. This includes forecasts and detailed analysis.
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-slate-900 mb-1">Show predictions and detailed insights</div>
              <div className="text-sm text-slate-600">
                When enabled, you'll see forecasts about future grades and performance trends.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={preferences?.advancedAnalyticsEnabled || false}
                onChange={(e) => handleAdvancedAnalyticsToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Feature Visibility Controls */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Choose what to show</h3>
        <p className="text-sm text-slate-600 mb-4">
          Turn features on or off to customize your dashboard. Features marked "Advanced" need predictions enabled above.
        </p>
        <div className="space-y-3">
          {DASHBOARD_FEATURES.map(feature => {
            const isVisible = config.features[feature.key]
            const isOverridden = preferences?.featureOverrides[feature.key] !== undefined
            const isBehaviorallyAdapted = preferences?.behavioralAdaptations?.autoHideFeatures.includes(feature.key) ||
              preferences?.behavioralAdaptations?.autoShowFeatures.includes(feature.key)

            return (
              <div
                key={feature.key}
                className="p-4 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{feature.label}</span>
                      {feature.isAdvanced && (
                        <Badge variant="default" size="sm">Advanced</Badge>
                      )}
                      {isOverridden && (
                        <Badge variant="info" size="sm">Manual</Badge>
                      )}
                      {isBehaviorallyAdapted && (
                        <Badge variant="success" size="sm">Recommended</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{feature.description}</div>
                    {isVisible && (
                      <div className="text-xs text-emerald-600 mt-1">✓ Currently visible</div>
                    )}
                    {!isVisible && (
                      <div className="text-xs text-slate-500 mt-1">
                        Currently hidden
                        {feature.isAdvanced && !preferences?.advancedAnalyticsEnabled && (
                          <span className="ml-1">(Enable Advanced Analytics to show)</span>
                        )}
                      </div>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => handleFeatureToggle(feature.key, e.target.checked)}
                      disabled={feature.isAdvanced && !preferences?.advancedAnalyticsEnabled}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      feature.isAdvanced && !preferences?.advancedAnalyticsEnabled
                        ? 'bg-slate-200 cursor-not-allowed'
                        : 'bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 peer-checked:bg-brand-500'
                    }`}></div>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Behavioral Insights */}
      {behavior && behavior.preferredFeatures.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Your Usage Patterns</h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-700 mb-2">
              Based on your usage, these features are most frequently accessed:
            </div>
            <div className="flex flex-wrap gap-2">
              {behavior.preferredFeatures.map(featureKey => {
                const feature = DASHBOARD_FEATURES.find(f => f.key === featureKey)
                return feature ? (
                  <Badge key={featureKey} variant="success" size="sm">
                    {feature.label}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        </div>
      )}

      {/* Replay Onboarding */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">{t('helpAndGuides') || 'Help & Guides'}</h3>
        <p className="text-sm text-slate-600 mb-3">
          {t('replayOnboardingDescription') || 'Take the guided tour again to learn about the adaptive dashboard features.'}
        </p>
        <Button
          variant="outline"
          onClick={replayOnboarding}
        >
          {t('replayDashboardGuide') || 'Replay Dashboard Guide'}
        </Button>
      </div>

      {/* Reset Button */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isDefault}
        >
          {t('resetToDefaults') || 'Reset to Default Settings'}
        </Button>
        <div className="flex-1" />
        {!isDefault && (
          <div className="text-sm text-slate-600 flex items-center">
            {t('customizedDashboardNote') || 'Your dashboard is customized. Reset to restore default settings based on grade level.'}
          </div>
        )}
        {isDefault && (
          <div className="text-sm text-slate-500 flex items-center">
            {t('usingDefaultSettings') || 'Using default settings based on grade level.'}
          </div>
        )}
      </div>
    </div>
  )
}

