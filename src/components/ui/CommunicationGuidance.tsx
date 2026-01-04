/**
 * Communication Guidance Component
 * Provides "How to Support Your Child" tips with what to say/not say
 */
import React, { useState } from 'react'
import { Card } from './Card'

interface CommunicationTip {
  concern: string
  avoid: string[]
  say: string[]
  tone: string
  timing: string
}

interface CommunicationGuidanceProps {
  concern: string
  tips: CommunicationTip
  className?: string
}

export function CommunicationGuidance({
  concern,
  tips,
  className = ''
}: CommunicationGuidanceProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className={`${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">How to Support Your Child</h4>
            <p className="text-sm text-slate-600">{concern}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          {/* What NOT to say */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h5 className="font-semibold text-slate-900">What NOT to say</h5>
            </div>
            <ul className="space-y-2 ml-8">
              {tips.avoid.map((phrase, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{phrase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What TO say */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h5 className="font-semibold text-slate-900">What TO say</h5>
            </div>
            <ul className="space-y-2 ml-8">
              {tips.say.map((phrase, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{phrase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tone Guidance */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h5 className="font-semibold text-amber-900 mb-2">Tone Guidance</h5>
            <p className="text-sm text-amber-800">{tips.tone}</p>
          </div>

          {/* Timing Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-semibold text-blue-900 mb-2">Best Time to Talk</h5>
            <p className="text-sm text-blue-800">{tips.timing}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

/**
 * Get communication tips based on concern type
 */
export function getCommunicationTips(
  concernType: 'low-performance' | 'declining-trend' | 'missing-assignments' | 'behavior'
): CommunicationTip {
  const tipsMap: Record<string, CommunicationTip> = {
    'low-performance': {
      concern: 'Supporting your child with low performance',
      avoid: [
        "Why didn't you study harder?",
        'You need to do better or else...',
        "Your sibling always gets better grades",
        "This is disappointing"
      ],
      say: [
        "Which part felt hardest?",
        "What can I help you with?",
        "Let's break this down into smaller steps",
        "I'm here to support you"
      ],
      tone: 'Use a supportive, curious tone. Ask open-ended questions to understand their challenges rather than assigning blame.',
      timing: 'Choose a calm moment after school or during the weekend. Avoid right after seeing grades or during stressful times.'
    },
    'declining-trend': {
      concern: 'Addressing a declining trend in performance',
      avoid: [
        "Your grades are getting worse",
        "What's wrong with you?",
        "You're not trying hard enough"
      ],
      say: [
        "I've noticed some changes - can we talk about it?",
        "Is there something making school harder lately?",
        "How can we work together to improve this?",
        "What support do you need?"
      ],
      tone: 'Approach with empathy and curiosity. Focus on understanding the underlying causes rather than the grades themselves.',
      timing: 'Schedule a dedicated conversation when you both have time and privacy. Avoid rushed moments or in front of others.'
    },
    'missing-assignments': {
      concern: 'Helping with missed or late assignments',
      avoid: [
        "Why haven't you done your homework?",
        "You're so lazy",
        "Just do it now!"
      ],
      say: [
        "What's making it hard to complete assignments?",
        "Let's create a plan together",
        "Would breaking it into smaller tasks help?",
        "I can help you organize your time"
      ],
      tone: 'Be collaborative rather than directive. Help them build systems and strategies rather than just demanding completion.',
      timing: 'Discuss during a planning session, not when the assignment is already late. Create a routine for checking in on assignments.'
    },
    'behavior': {
      concern: 'Discussing behavior concerns',
      avoid: [
        "You're always causing trouble",
        "What's wrong with you?",
        "You need to behave"
      ],
      say: [
        "Can you help me understand what happened?",
        "How were you feeling when this occurred?",
        "What can we do differently next time?",
        "Let's think about how this affects others"
      ],
      tone: 'Maintain calm and seek understanding. Focus on the behavior, not the child\'s character. Emphasize learning and growth.',
      timing: 'Wait until emotions have cooled. Choose a private, calm setting. Avoid discussing right after an incident when emotions are high.'
    }
  }

  return tipsMap[concernType] || tipsMap['low-performance']
}

