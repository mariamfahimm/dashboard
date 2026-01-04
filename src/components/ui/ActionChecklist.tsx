/**
 * Action Checklist Component
 * Converts AI recommendations into trackable action items
 */
import React, { useState, useEffect } from 'react'
import { Card } from './Card'

export interface ActionItem {
  id: string
  text: string
  completed: boolean
  reminder?: Date
}

interface ActionChecklistProps {
  recommendationId: string
  title: string
  actionItems: Omit<ActionItem, 'completed'>[]
  onItemsChange?: (items: ActionItem[]) => void
  className?: string
}

export function ActionChecklist({
  recommendationId,
  title,
  actionItems,
  onItemsChange,
  className = ''
}: ActionChecklistProps) {
  const [items, setItems] = useState<ActionItem[]>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(`action_checklist_${recommendationId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading action checklist:', error)
    }

    // Initialize from props
    return actionItems.map(item => ({ ...item, completed: false }))
  })

  // Save to localStorage when items change
  useEffect(() => {
    try {
      localStorage.setItem(`action_checklist_${recommendationId}`, JSON.stringify(items))
      onItemsChange?.(items)
    } catch (error) {
      console.error('Error saving action checklist:', error)
    }
  }, [items, recommendationId, onItemsChange])

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card className={`${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-900 mb-1">{title}</h4>
          <p className="text-sm text-slate-600">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        {totalCount > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600">{Math.round(progress)}%</div>
            <div className="text-xs text-slate-500">Progress</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        {items.map(item => (
          <label
            key={item.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${
                item.completed
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-slate-300 hover:border-brand-300 hover:bg-brand-50'
              }
            `}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id)}
              className="mt-1 w-5 h-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500 focus:ring-2"
            />
            <div className="flex-1">
              <span
                className={`
                  text-sm
                  ${item.completed ? 'line-through text-slate-500' : 'text-slate-900'}
                `}
              >
                {item.text}
              </span>
              {item.reminder && !item.completed && (
                <div className="mt-1 text-xs text-slate-500">
                  Reminder: {new Date(item.reminder).toLocaleDateString()}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          No action items for this recommendation yet.
        </p>
      )}
    </Card>
  )
}

