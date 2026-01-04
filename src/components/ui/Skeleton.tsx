// Skeleton Loading Component - Shows loading placeholders
import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  variant?: 'text' | 'circular' | 'rectangular'
  lines?: number // For text variant
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'rectangular',
  lines = 1,
  animation = 'pulse',
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }

  const baseClasses = `bg-slate-200 ${roundedClasses[rounded]} ${animationClasses[animation]} ${className}`

  // Text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={{
              width: i === lines - 1 ? '60%' : width || '100%',
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    )
  }

  // Single skeleton element
  return (
    <div
      className={baseClasses}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'circular' ? width : '1rem'),
      }}
    />
  )
}

// Pre-built skeleton components for common patterns
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton variant="text" lines={lines} />
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1rem" width="100%" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="1rem" width="100%" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      {/* Welcome Card */}
      <div className="col-span-12 md:col-span-7">
        <CardSkeleton lines={2} />
      </div>
      {/* Attendance Card */}
      <div className="col-span-12 md:col-span-2">
        <CardSkeleton lines={1} />
      </div>
      {/* Calendar Card */}
      <div className="col-span-12 md:col-span-3">
        <CardSkeleton lines={4} />
      </div>
      {/* Other Cards */}
      <div className="col-span-12 md:col-span-6">
        <CardSkeleton lines={3} />
      </div>
      <div className="col-span-12 md:col-span-6">
        <CardSkeleton lines={3} />
      </div>
    </div>
  )
}

export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  }
  return <Skeleton className={sizes[size]} variant="circular" />
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <AvatarSkeleton size="sm" />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

