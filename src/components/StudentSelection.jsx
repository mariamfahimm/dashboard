// Student Selection Component - Beautiful card-based layout for choosing children
import React, { useState, useEffect } from 'react'
import { useStudents } from '../hooks/useStudents'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from './EmptyState'
import { ChildCard } from './ChildCard'
import { useGrades } from '../hooks/useGrades'

// Component to display student card with stats
function StudentCardWithStats({ student, isHovered, onHover, onLeave, onClick }) {
  // Get grades - hook handles errors internally
  const { grades } = useGrades(student._id)
  
  // Calculate average grade safely
  const averageGrade = grades && Array.isArray(grades) && grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length)
    : undefined
  
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <ChildCard
        student={{
          ...student,
          averageGrade,
          attendanceRate: 95 // TODO: Get from API
        }}
        isSelected={isHovered}
        onClick={onClick}
      />
    </div>
  )
}

export function StudentSelection({ onSelect, onSkip }) {
  const { user } = useAuth()
  const { students, loading, error } = useStudents(user?._id)
  const [hoveredId, setHoveredId] = useState(null)

  // Debug logging
  useEffect(() => {
    console.log('StudentSelection - user:', user?._id, 'loading:', loading, 'error:', error, 'students:', students?.length)
  }, [user, loading, error, students])

  // Auto-select single student - MUST be at top level (before any conditional returns)
  useEffect(() => {
    if (students && students.length === 1 && students[0]._id && onSelect) {
      const timer = setTimeout(() => {
        onSelect(students[0]._id)
      }, 2000) // Show card for 2 seconds, then auto-select
      
      return () => clearTimeout(timer)
    }
  }, [students, onSelect])

  const handleStudentClick = (studentId) => {
    if (onSelect) {
      onSelect(studentId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center mx-auto mb-4 animate-pulse shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-soft">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 grid place-items-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Students</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 shadow-lg shadow-brand-500/30 transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-soft">
          <EmptyState
            icon="👤"
            title="No Students Found"
            message="No student records are linked to your account. Please contact your administrator to link a student to your account, or use the Admin Demo to create a student."
          />
        </div>
      </div>
    )
  }

  // If only one student, still show card (auto-select happens in useEffect above)
  if (students.length === 1) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Welcome!
            </h1>
            <p className="text-slate-600">Loading your child's dashboard...</p>
          </div>
          <ChildCard
            student={students[0]}
            isSelected={true}
            onClick={() => {
              if (onSelect) {
                onSelect(students[0]._id)
              }
            }}
          />
          <div className="text-center mt-6">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            <p className="text-sm text-slate-500 mt-3">Opening dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Multiple students - show modern selection screen matching dashboard style
  return (
    <div className="min-h-screen bg-slate-50 p-6 relative overflow-hidden">
      {/* Subtle gradient background matching dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Clean header matching dashboard style */}
        <div className="text-center mb-12 pt-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            Select Your Child
          </h1>
          <p className="text-lg text-slate-600 font-medium animate-fade-in-up animation-delay-200">
            Choose which child you'd like to monitor
          </p>
        </div>

        {/* Card grid matching dashboard card style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {students.map((student, index) => (
            <div
              key={student._id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <StudentCardWithStats
                student={student}
                isHovered={hoveredId === student._id}
                onHover={() => setHoveredId(student._id)}
                onLeave={() => setHoveredId(null)}
                onClick={() => handleStudentClick(student._id)}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

