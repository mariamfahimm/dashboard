// Goals Hook
import { useState, useEffect, useCallback } from 'react'
import { goalsApi, type Goal, type GoalCreateData, type GoalUpdateData } from '../services/api/goalsApi'

export function useGoals(studentId?: string) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGoals() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await goalsApi.getForStudent(studentId)
        setGoals(response.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goals')
        setGoals([])
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [studentId])

  const refresh = useCallback(async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await goalsApi.getForStudent(studentId)
      setGoals(response.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh goals')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const createGoal = useCallback(async (data: GoalCreateData): Promise<Goal | null> => {
    try {
      const response = await goalsApi.create(data)
      const newGoal = response.data
      
      // Add to local state if it's for the current student
      if (studentId && newGoal.studentId === studentId) {
        setGoals(prev => [...prev, newGoal])
      }
      
      return newGoal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      return null
    }
  }, [studentId])

  const updateGoal = useCallback(async (id: string, data: GoalUpdateData): Promise<Goal | null> => {
    try {
      const response = await goalsApi.update(id, data)
      const updatedGoal = response.data
      
      // Update in local state
      setGoals(prev => prev.map(g => g._id === id ? updatedGoal : g))
      
      return updatedGoal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
      return null
    }
  }, [])

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      await goalsApi.delete(id)
      
      // Remove from local state
      setGoals(prev => prev.filter(g => g._id !== id))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      return false
    }
  }, [])

  const recalculateGoal = useCallback(async (id: string): Promise<Goal | null> => {
    try {
      const response = await goalsApi.recalculate(id)
      const updatedGoal = response.data
      
      // Update in local state
      setGoals(prev => prev.map(g => g._id === id ? updatedGoal : g))
      
      return updatedGoal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate goal')
      return null
    }
  }, [])

  return {
    goals,
    loading,
    error,
    refresh,
    createGoal,
    updateGoal,
    deleteGoal,
    recalculateGoal
  }
}

