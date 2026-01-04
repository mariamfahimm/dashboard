// Avatar Component - Displays student avatar with initials fallback
import React from 'react'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showOnlineIndicator?: boolean
  isOnline?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl'
}

const indicatorSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4'
}

// Generate gradient colors based on name
const getGradientColors = (name: string): string => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-red-400 to-red-600',
    'from-orange-400 to-orange-600',
    'from-amber-400 to-amber-600',
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600'
  ]
  
  // Use name to consistently pick a color
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function Avatar({ 
  name, 
  src, 
  size = 'md', 
  className = '',
  showOnlineIndicator = false,
  isOnline = false
}: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const indicatorSize = indicatorSizes[size]
  const gradient = getGradientColors(name)
  const initials = getInitials(name)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br ${gradient} overflow-hidden ring-2 ring-white shadow-sm`}>
        {src ? (
          <img 
            src={src} 
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = initials
                parent.className = `${sizeClass} rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br ${gradient} ring-2 ring-white shadow-sm`
              }
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showOnlineIndicator && (
        <div className={`
          absolute bottom-0 right-0 rounded-full border-2 border-white
          ${indicatorSize}
          ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}
        `} />
      )}
    </div>
  )
}

