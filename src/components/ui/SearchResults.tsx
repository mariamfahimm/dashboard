// Search Results Dropdown Component
import React from 'react'
import { HiChevronRight } from 'react-icons/hi'
import type { SearchResult } from '../../hooks/useGlobalSearch'

interface SearchResultsProps {
  results: SearchResult[]
  loading: boolean
  onSelect: (result: SearchResult) => void
  onClose: () => void
}

export function SearchResults({ results, loading, onSelect, onClose }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
        <div className="p-4 text-center text-slate-500">
          <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Searching...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
        <div className="p-6 text-center text-slate-500">
          <p className="text-sm">No results found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
        </div>
      </div>
    )
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const typeLabels = {
    student: 'Students',
    grade: 'Grades',
    assignment: 'Assignments',
    message: 'Messages'
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
      <div className="p-2">
        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <div key={type} className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {typeLabels[type as keyof typeof typeLabels] || type}
            </div>
            {typeResults.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onSelect(result)
                  onClose()
                }}
                className="w-full px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center gap-3 group"
              >
                <span className="text-xl flex-shrink-0">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-slate-500 truncate">
                      {result.subtitle}
                    </div>
                  )}
                  {result.metadata && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {result.metadata}
                    </div>
                  )}
                </div>
                <HiChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        ))}
      </div>
      {results.length >= 10 && (
        <div className="px-3 py-2 border-t border-slate-200 text-xs text-slate-500 text-center">
          Showing top 10 results
        </div>
      )}
    </div>
  )
}

