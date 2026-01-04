// Breadcrumb Navigation Component
import React from 'react'
import { HiChevronRight, HiHome } from 'react-icons/hi'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index === 0 ? (
            <a
              href={item.href || '#'}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              onClick={(e) => {
                if (item.href) {
                  e.preventDefault()
                  window.location.hash = item.href
                }
              }}
            >
              <HiHome className="w-4 h-4" />
            </a>
          ) : (
            <>
              <HiChevronRight className="w-4 h-4 text-slate-400" />
              {item.href ? (
                <a
                  href={item.href}
                  className={`${
                    index === items.length - 1
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-600 hover:text-slate-900'
                  } transition-colors`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.hash = item.href!
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={
                    index === items.length - 1
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-600'
                  }
                >
                  {item.label}
                </span>
              )}
            </>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

