/**
 * Video-Like Tour Component
 * Interactive tour with animated cursor/highlight that moves between elements
 */
import React, { useState, useEffect, useRef } from 'react'
import { Button } from './Button'

export interface TourStep {
  id: string
  target: string // CSS selector or 'center' for centered message
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlight?: boolean
  cursorAction?: 'click' | 'hover' | 'point' // What the cursor should do
}

interface VideoLikeTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isActive: boolean
  t: (key: string) => string
}

export function VideoLikeTour({ steps, onComplete, onSkip, isActive, t }: VideoLikeTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCursor, setShowCursor] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) {
      setShowCursor(false)
      return
    }

    const step = steps[currentStep]
    
    // Find target element
    if (step.target === 'center') {
      setTargetElement(null)
      setShowCursor(false)
      positionTooltip()
    } else if (step.target === 'aside') {
      // Special case: target the sidebar
      const sidebar = document.querySelector('aside') as HTMLElement
      if (sidebar) {
        setTargetElement(sidebar)
        animateToElement(sidebar)
      } else {
        // Skip if sidebar not found
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
          } else {
            onComplete()
          }
        }, 500)
      }
    } else {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setTargetElement(element)
        animateToElement(element)
      } else {
        // Element not found, skip to next step
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
  }, [currentStep, isActive, steps])

  const animateToElement = (element: HTMLElement) => {
    setIsAnimating(true)
    setShowCursor(true)
    
    const rect = element.getBoundingClientRect()
    const targetX = rect.left + rect.width / 2
    const targetY = rect.top + rect.height / 2
    
    // Get current cursor position (or start from center)
    const startX = cursorPosition.x || window.innerWidth / 2
    const startY = cursorPosition.y || window.innerHeight / 2
    
    // Animate cursor to target
    const duration = 800 // ms
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-in-out)
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const x = startX + (targetX - startX) * easeProgress
      const y = startY + (targetY - startY) * easeProgress
      
      setCursorPosition({ x, y })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        // Position tooltip after cursor arrives
        setTimeout(() => {
          positionTooltip()
          // Show highlight after cursor arrives
          if (highlightRef.current && targetElement) {
            updateHighlight()
          }
        }, 200)
      }
    }
    
    requestAnimationFrame(animate)
  }

  const updateHighlight = () => {
    if (!targetElement || !highlightRef.current) return
    
    const rect = targetElement.getBoundingClientRect()
    highlightRef.current.style.top = `${rect.top - 8}px`
    highlightRef.current.style.left = `${rect.left - 8}px`
    highlightRef.current.style.width = `${rect.width + 16}px`
    highlightRef.current.style.height = `${rect.height + 16}px`
    highlightRef.current.style.opacity = '1'
  }

  useEffect(() => {
    if (targetElement && !isAnimating) {
      updateHighlight()
      
      const handleResize = () => {
        updateHighlight()
        positionTooltip()
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [targetElement, isAnimating])

  const positionTooltip = () => {
    if (!tooltipRef.current) return

    const step = steps[currentStep]
    if (step.target === 'center') {
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

    tooltip.style.position = 'fixed'
    tooltip.style.transform = 'none'

    switch (position) {
      case 'top':
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 24}px`
        tooltip.style.left = `${rect.left + rect.width / 2}px`
        tooltip.style.transform = 'translateX(-50%)'
        break
      case 'bottom':
        tooltip.style.top = `${rect.bottom + 24}px`
        tooltip.style.left = `${rect.left + rect.width / 2}px`
        tooltip.style.transform = 'translateX(-50%)'
        break
      case 'left':
        tooltip.style.top = `${rect.top + rect.height / 2}px`
        tooltip.style.left = `${rect.left - tooltip.offsetWidth - 24}px`
        tooltip.style.transform = 'translateY(-50%)'
        break
      case 'right':
        tooltip.style.top = `${rect.top + rect.height / 2}px`
        tooltip.style.left = `${rect.right + 24}px`
        tooltip.style.transform = 'translateY(-50%)'
        break
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setShowCursor(false)
      if (highlightRef.current) {
        highlightRef.current.style.opacity = '0'
      }
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 300)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    setShowCursor(false)
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
        className="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-500"
        onClick={step.target === 'center' ? handleSkip : undefined}
        style={{
          pointerEvents: step.target === 'center' ? 'auto' : 'none'
        }}
      >
        {/* Highlight cutout with pulsing effect */}
        {targetElement && step.highlight !== false && step.target !== 'center' && (
          <div
            ref={highlightRef}
            className="absolute border-4 border-brand-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-500"
            style={{
              opacity: 0,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px rgba(92,124,247,0.5)',
              animation: 'pulse-highlight 2s ease-in-out infinite'
            }}
          />
        )}
      </div>

      {/* Animated Cursor */}
      {showCursor && targetElement && step.target !== 'center' && (
        <div
          ref={cursorRef}
          className="fixed z-[9999] pointer-events-none transition-all duration-300"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            transition: isAnimating ? 'none' : 'all 0.3s ease'
          }}
        >
          <div className="relative">
            {/* Cursor icon */}
            <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-brand-500">
              <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
            </div>
            {/* Click animation */}
            {step.cursorAction === 'click' && (
              <div className="absolute inset-0 animate-ping">
                <div className="w-8 h-8 bg-brand-500/30 rounded-full"></div>
              </div>
            )}
            {/* Ripple effect */}
            <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 border-2 border-brand-400 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl p-6 max-w-sm animate-fade-in"
        style={{
          minWidth: '320px',
          maxWidth: '400px',
          animation: 'fadeIn 0.4s ease-out'
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-slate-500">
            {(t('step') === 'step' ? 'Step' : t('step'))} {currentStep + 1} {(t('of') === 'of' ? 'of' : t('of'))} {steps.length}
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
            {t('skipTour') === 'skipTour' ? 'Skip Tour' : t('skipTour')}
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCursor(false)
                  if (highlightRef.current) {
                    highlightRef.current.style.opacity = '0'
                  }
                  setTimeout(() => {
                    setCurrentStep(currentStep - 1)
                  }, 300)
                }}
              >
                {t('previous') || 'Previous'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? (t('gotIt') === 'gotIt' ? 'Got it!' : t('gotIt')) : (t('next') === 'next' ? 'Next' : t('next'))}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
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

      <style>{`
        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 20px rgba(92,124,247,0.5);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(92,124,247,0.8);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </>
  )
}

