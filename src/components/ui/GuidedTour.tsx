/**
 * Guided Tour Component
 * Lightweight first-time onboarding walkthrough for adaptive dashboard
 */
import React, { useState, useEffect, useRef } from 'react'
import { Button } from './Button'

export interface TourStep {
  id: string
  target: string // CSS selector or 'center' for centered message
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlight?: boolean // Whether to highlight the target element
}

interface GuidedTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isActive: boolean
  t: (key: string) => string
}

export function GuidedTour({ steps, onComplete, onSkip, isActive, t }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) {
      return
    }

    const step = steps[currentStep]
    
    // Find target element
    if (step.target === 'center') {
      setTargetElement(null)
    } else {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setTargetElement(element)
        // Scroll to target if needed
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } else {
        // Element not found, skip to next step after delay
        console.warn(`Tour target not found: ${step.target}`)
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
          } else {
            onComplete()
          }
        }, 500)
      }
    }

    // Position tooltip
    setTimeout(() => {
      if (step.target === 'center' || targetElement) {
        positionTooltip()
      }
    }, 200)
  }, [currentStep, isActive, steps])

  useEffect(() => {
    const handleResize = () => {
      if (isActive && currentStep < steps.length) {
        positionTooltip()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive, currentStep, steps.length])

  const positionTooltip = () => {
    if (!tooltipRef.current) return

    const step = steps[currentStep]
    if (step.target === 'center') {
      // Center the tooltip
      tooltipRef.current.style.position = 'fixed'
      tooltipRef.current.style.top = '50%'
      tooltipRef.current.style.left = '50%'
      tooltipRef.current.style.transform = 'translate(-50%, -50%)'
      return
    }

    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    const tooltip = tooltipRef.current
    const position = step.position || 'bottom'

    // Reset positioning
    tooltip.style.position = 'fixed'
    tooltip.style.transform = 'none'

    switch (position) {
      case 'top':
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 16}px`
        tooltip.style.left = `${rect.left + rect.width / 2}px`
        tooltip.style.transform = 'translateX(-50%)'
        break
      case 'bottom':
        tooltip.style.top = `${rect.bottom + 16}px`
        tooltip.style.left = `${rect.left + rect.width / 2}px`
        tooltip.style.transform = 'translateX(-50%)'
        break
      case 'left':
        tooltip.style.top = `${rect.top + rect.height / 2}px`
        tooltip.style.left = `${rect.left - tooltip.offsetWidth - 16}px`
        tooltip.style.transform = 'translateY(-50%)'
        break
      case 'right':
        tooltip.style.top = `${rect.top + rect.height / 2}px`
        tooltip.style.left = `${rect.right + 16}px`
        tooltip.style.transform = 'translateY(-50%)'
        break
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isActive || currentStep >= steps.length) {
    return null
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
        onClick={handleSkip}
        style={{
          pointerEvents: step.target === 'center' ? 'auto' : 'auto'
        }}
      >
        {/* Highlight cutout */}
        {targetElement && step.highlight !== false && step.target !== 'center' && (
          <div
            className="absolute border-4 border-brand-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 max-w-sm"
        style={{
          minWidth: '320px',
          maxWidth: '400px'
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-slate-500">
            {t('step') || 'Step'} {currentStep + 1} {t('of') || 'of'} {steps.length}
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={t('skip') || 'Skip'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          {step.title}
        </h3>
        <p className="text-base text-slate-700 leading-relaxed mb-6">
          {step.content}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            {t('skipTour') || 'Skip Tour'}
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                {t('previous') || 'Previous'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? (t('gotIt') || 'Got it!') : (t('next') || 'Next')}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-brand-500'
                  : index < currentStep
                  ? 'w-2 bg-brand-300'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

