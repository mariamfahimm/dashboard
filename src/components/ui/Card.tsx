// Beautiful Card Component with hover effects and animations
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', hover = false, onClick, padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const baseStyles = 'bg-white rounded-2xl shadow-soft transition-all duration-300'
  const hoverStyles = hover || onClick ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

