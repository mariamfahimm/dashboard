/**
 * Dashboard Onboarding Tour
 * First-time user guided tour for adaptive dashboard
 */
import React, { useEffect, useState } from 'react'
import { VideoLikeTour, type TourStep } from './VideoLikeTour'
import { useUserAdaptive } from '../../context/UserAdaptiveContext'
import { useAuth } from '../../context/AuthContext'

interface DashboardOnboardingProps {
  studentId?: string
  gradeLevel?: number
  t: (key: string) => string
}

const STORAGE_KEY = 'educonnect_onboarding_completed'

export function DashboardOnboarding({ studentId, gradeLevel, t }: DashboardOnboardingProps) {
  const { user } = useAuth()
  const adaptiveConfig = useUserAdaptive(studentId, gradeLevel)
  const [isActive, setIsActive] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // Check if onboarding should start
  useEffect(() => {
    if (!user?._id) return

    const completedKey = `${STORAGE_KEY}_${user._id}`
    
    // Check for replay trigger from settings
    const replayTrigger = sessionStorage.getItem('replay_onboarding')
    if (replayTrigger === 'true') {
      sessionStorage.removeItem('replay_onboarding')
      localStorage.removeItem(completedKey)
      setTimeout(() => {
        setIsActive(true)
      }, 800)
      return
    }
    
    if (hasChecked) return
    
    const hasCompleted = localStorage.getItem(completedKey) === 'true'
    if (!hasCompleted) {
      // Small delay to ensure page is rendered
      setTimeout(() => {
        setIsActive(true)
      }, 1000)
    }
    
    setHasChecked(true)
  }, [user?._id, hasChecked])

  const handleComplete = () => {
    if (user?._id) {
      const completedKey = `${STORAGE_KEY}_${user._id}`
      localStorage.setItem(completedKey, 'true')
    }
    setIsActive(false)
  }

  const handleSkip = () => {
    if (user?._id) {
      const completedKey = `${STORAGE_KEY}_${user._id}`
      localStorage.setItem(completedKey, 'true')
    }
    setIsActive(false)
  }

  // Helper function to get translation with fallback
  const getText = (key: string, fallback: string): string => {
    const translated = t(key)
    // If translation returns the key itself (not found), use fallback
    return translated === key ? fallback : translated
  }

  // Define tour steps
  const steps: TourStep[] = [
    {
      id: 'welcome',
      target: 'center',
      title: getText('onboardingWelcomeTitle', 'Welcome to Your Dashboard!'),
      content: getText('onboardingWelcomeContent', 
        'This dashboard shows your child\'s progress and adapts to what you need. Let\'s take a quick tour to show you around.'),
      position: 'center',
      highlight: false
    },
    {
      id: 'navigation',
      target: 'aside',
      title: getText('onboardingNavigationTitle', 'Navigate Easily'),
      content: getText('onboardingNavigationContent', 
        'Use the menu on the left to visit different pages like Grades, Assignments, and Messages. Everything is just one click away.'),
      position: 'right',
      highlight: true,
      cursorAction: 'point'
    },
    {
      id: 'essential',
      target: '[data-tour="growth-insights"]',
      title: getText('onboardingEssentialTitle', 'See Your Child\'s Progress'),
      content: getText('onboardingEssentialContent', 
        'This shows how your child is doing overall. You\'ll see if they\'re improving, staying steady, or need support.'),
      position: 'bottom',
      highlight: true,
      cursorAction: 'point'
    },
    {
      id: 'grades',
      target: '[data-tour="grades-overview"]',
      title: getText('onboardingGradesTitle', 'Check Grades by Subject'),
      content: getText('onboardingGradesContent', 
        'See how your child is performing in each subject. Green means doing well, yellow means keep practicing.'),
      position: 'bottom',
      highlight: true,
      cursorAction: 'point'
    },
    {
      id: 'optional',
      target: '[data-tour="expandable-features"]',
      title: getText('onboardingOptionalTitle', 'More Details Available'),
      content: getText('onboardingOptionalContent', 
        'Want more information? Click "View More Insights" to see predictions and detailed analysis. This is optional - you can skip it if you prefer.'),
      position: 'top',
      highlight: true,
      cursorAction: 'click'
    },
    {
      id: 'personalization',
      target: '[data-tour="customize-link"]',
      title: getText('onboardingPersonalizationTitle', 'Make It Your Own'),
      content: getText('onboardingPersonalizationContent', 
        'Click here to choose how much detail you want to see. You can keep it simple or show everything - it\'s up to you.'),
      position: 'bottom',
      highlight: true,
      cursorAction: 'click'
    },
    {
      id: 'final',
      target: 'center',
      title: getText('onboardingFinalTitle', 'You\'re All Set!'),
      content: getText('onboardingFinalContent', 
        'Let\'s start tracking your child\'s learning journey together. Everything can be changed anytime, so explore with confidence!'),
      position: 'center',
      highlight: false
    }
  ]

  if (!isActive) {
    return null
  }

  return (
    <VideoLikeTour
      steps={steps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      isActive={isActive}
      t={t}
    />
  )
}

/**
 * Hook to replay onboarding
 */
export function useReplayOnboarding() {
  const { user } = useAuth()

  const replayOnboarding = () => {
    if (user?._id) {
      // Use sessionStorage to trigger replay
      sessionStorage.setItem('replay_onboarding', 'true')
      // Navigate to Academic Progress page if not already there
      if (window.location.hash !== '#/progress') {
        window.location.hash = '#/progress'
      } else {
        // If already on the page, trigger a small reload
        window.location.reload()
      }
    }
  }

  return { replayOnboarding }
}

