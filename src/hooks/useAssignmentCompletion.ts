// Assignment Completion Prediction Hook
import { useState, useEffect } from 'react'
import { assignmentCompletionApi, type AssignmentCompletionPrediction } from '../services/api/assignmentCompletionApi'

export function useAssignmentCompletion(studentId?: string, assignmentId?: string) {
  const [prediction, setPrediction] = useState<AssignmentCompletionPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrediction() {
      if (!studentId || !assignmentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await assignmentCompletionApi.getForAssignment(studentId, assignmentId)
        setPrediction(response.data)
      } catch (err) {
        console.error('Error loading assignment completion prediction:', err)
        setError(err instanceof Error ? err.message : 'Failed to load prediction')
        setPrediction(null)
      } finally {
        setLoading(false)
      }
    }

    loadPrediction()
  }, [studentId, assignmentId])

  const refresh = async () => {
    if (!studentId || !assignmentId) return

    try {
      setLoading(true)
      const response = await assignmentCompletionApi.getForAssignment(studentId, assignmentId)
      setPrediction(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh prediction')
    } finally {
      setLoading(false)
    }
  }

  return {
    prediction,
    loading,
    error,
    refresh
  }
}

export function useAllAssignmentCompletions(studentId?: string) {
  const [predictions, setPredictions] = useState<AssignmentCompletionPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPredictions() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await assignmentCompletionApi.getAll(studentId)
        setPredictions(response.data || [])
      } catch (err) {
        console.error('Error loading assignment completion predictions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load predictions')
        setPredictions([])
      } finally {
        setLoading(false)
      }
    }

    loadPredictions()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await assignmentCompletionApi.getAll(studentId)
      setPredictions(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh predictions')
    } finally {
      setLoading(false)
    }
  }

  // Helper to get prediction for a specific assignment
  const getPrediction = (assignmentId: string): AssignmentCompletionPrediction | undefined => {
    return predictions.find(p => p.assignmentId === assignmentId)
  }

  return {
    predictions,
    loading,
    error,
    refresh,
    getPrediction
  }
}

