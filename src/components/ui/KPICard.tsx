// Beautiful KPI Card Component with animations
import React from 'react'
import { Card } from './Card'
import { Badge } from './Badge'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  icon?: React.ReactNode
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'blue'
  loading?: boolean
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  color = 'brand',
  loading = false 
}: KPICardProps) {
  const colorClasses = {
    brand: 'from-brand-500 to-brand-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    blue: 'from-blue-500 to-blue-600'
  }

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card hover className="relative overflow-hidden group">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {title}
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {value}
            </div>
            {subtitle && (
              <div className="text-sm text-slate-600">
                {subtitle}
              </div>
            )}
          </div>
          {icon && (
            <div className={`
              h-12 w-12 rounded-xl flex items-center justify-center text-2xl
              bg-gradient-to-br ${colorClasses[color]} text-white
              shadow-md
            `}>
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Badge 
              variant={trend.isPositive ? 'success' : 'warning'} 
              size="sm"
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Badge>
            <span className="text-xs text-slate-500">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

