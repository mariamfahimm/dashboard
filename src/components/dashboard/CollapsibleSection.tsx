// CollapsibleSection - Expandable/collapsible content section
import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  defaultCollapsed?: boolean
  children: React.ReactNode
  className?: string
  locale?: string
}

export function CollapsibleSection({
  title,
  icon,
  defaultCollapsed = true,
  children,
  className = '',
  locale = 'en',
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const isRTL = locale === 'ar'

  return (
    <Card className={`col-span-12 ${className}`} padding="md">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className={`font-semibold text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>{title}</h3>
        </div>
        {isCollapsed ? (
          <HiChevronDown className={`w-5 h-5 text-slate-500 ${isRTL ? 'rotate-180' : ''}`} />
        ) : (
          <HiChevronUp className={`w-5 h-5 text-slate-500 ${isRTL ? 'rotate-180' : ''}`} />
        )}
      </button>
      {!isCollapsed && <div>{children}</div>}
    </Card>
  )
}

