/**
 * Grade Mode Context
 * Manages grade-aware UI mode per student
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getGradeModeFromLevel, getGradeModeConfig, type GradeMode, type GradeModeConfig } from '../utils/gradeModeUtils'

interface StudentGradeMode {
  studentId: string
  mode: GradeMode
  isManualOverride: boolean
}

interface GradeModeContextType {
  getGradeMode: (studentId: string, gradeLevel: number) => GradeMode
  getGradeModeConfigForStudent: (studentId: string, gradeLevel: number) => GradeModeConfig
  setManualMode: (studentId: string, mode: GradeMode) => void
  clearManualMode: (studentId: string) => void
  isManualOverride: (studentId: string) => boolean
}

const GradeModeContext = createContext<GradeModeContextType | undefined>(undefined)

const STORAGE_KEY = 'educonnect_grade_modes'

export function GradeModeProvider({ children }: { children: React.ReactNode }) {
  const [studentModes, setStudentModes] = useState<Map<string, StudentGradeMode>>(new Map())

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, StudentGradeMode>
        setStudentModes(new Map(Object.entries(parsed)))
      }
    } catch (error) {
      console.error('Error loading grade modes from localStorage:', error)
    }
  }, [])

  // Save to localStorage when modes change
  useEffect(() => {
    try {
      const obj = Object.fromEntries(studentModes)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    } catch (error) {
      console.error('Error saving grade modes to localStorage:', error)
    }
  }, [studentModes])

  const getGradeMode = useCallback((studentId: string, gradeLevel: number): GradeMode => {
    const stored = studentModes.get(studentId)
    if (stored && stored.isManualOverride) {
      return stored.mode
    }
    return getGradeModeFromLevel(gradeLevel)
  }, [studentModes])

  const getGradeModeConfigForStudent = useCallback((studentId: string, gradeLevel: number): GradeModeConfig => {
    const mode = getGradeMode(studentId, gradeLevel)
    return getGradeModeConfig(mode)
  }, [getGradeMode])

  const setManualMode = useCallback((studentId: string, mode: GradeMode) => {
    setStudentModes(prev => {
      const next = new Map(prev)
      next.set(studentId, {
        studentId,
        mode,
        isManualOverride: true
      })
      return next
    })
  }, [])

  const clearManualMode = useCallback((studentId: string) => {
    setStudentModes(prev => {
      const next = new Map(prev)
      next.delete(studentId)
      return next
    })
  }, [])

  const isManualOverride = useCallback((studentId: string): boolean => {
    return studentModes.get(studentId)?.isManualOverride ?? false
  }, [studentModes])

  return (
    <GradeModeContext.Provider
      value={{
        getGradeMode,
        getGradeModeConfigForStudent,
        setManualMode,
        clearManualMode,
        isManualOverride
      }}
    >
      {children}
    </GradeModeContext.Provider>
  )
}

export function useGradeMode(studentId?: string, gradeLevel?: number) {
  const context = useContext(GradeModeContext)
  if (!context) {
    throw new Error('useGradeMode must be used within GradeModeProvider')
  }

  if (!studentId || gradeLevel === undefined) {
    return {
      mode: 'upper-primary' as GradeMode,
      config: getGradeModeConfig('upper-primary'),
      setManualMode: () => {},
      clearManualMode: () => {},
      isManualOverride: false
    }
  }

  const mode = context.getGradeMode(studentId, gradeLevel)
  const config = context.getGradeModeConfigForStudent(studentId, gradeLevel)
  const isOverride = context.isManualOverride(studentId)

  return {
    mode,
    config,
    setManualMode: (newMode: GradeMode) => context.setManualMode(studentId, newMode),
    clearManualMode: () => context.clearManualMode(studentId),
    isManualOverride: isOverride
  }
}

