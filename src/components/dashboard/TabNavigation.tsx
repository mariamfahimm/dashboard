// TabNavigation - Tab component for organizing dashboard content
import React from 'react'

export type TabId = 'overview' | 'academics' | 'activity'

interface TabNavigationProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  t?: (key: string) => string
}

export function TabNavigation({ activeTab, onTabChange, t }: TabNavigationProps) {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: t?.('overview') || 'Overview', icon: '📊' },
    { id: 'academics', label: t?.('academics') || 'Academics', icon: '📚' },
    { id: 'activity', label: t?.('activity') || 'Activity', icon: '🔔' },
  ]

  return (
    <div className="col-span-12 mb-6">
      <div className="flex flex-wrap gap-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-1.5 shadow-md border border-slate-200 w-full md:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-5 md:px-6 py-3 rounded-lg text-sm font-semibold
              transition-all duration-300 flex-1 md:flex-initial
              ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg transform scale-105'
                  : 'text-slate-600 hover:bg-white/80 hover:shadow-sm'
              }
            `}
          >
            <span className={activeTab === tab.id ? 'text-lg' : 'text-base'}>{tab.icon}</span>
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

