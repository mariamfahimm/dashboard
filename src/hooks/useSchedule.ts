// Schedule/Timetable Hook
import { useState, useEffect } from 'react'
import { scheduleApi, type ScheduleEntry, type WeeklySchedule } from '../services/api/scheduleApi'

export function useSchedule(studentId?: string, dayOfWeek?: number) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSchedule() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await scheduleApi.getByStudent(studentId, dayOfWeek)
        setEntries(response.data || [])
      } catch (err) {
        console.error('Error loading schedule:', err)
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
        setEntries([])
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [studentId, dayOfWeek])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await scheduleApi.getByStudent(studentId, dayOfWeek)
      setEntries(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh schedule')
    } finally {
      setLoading(false)
    }
  }

  return {
    entries,
    loading,
    error,
    refresh
  }
}

export function useWeeklySchedule(studentId?: string) {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWeeklySchedule() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await scheduleApi.getWeekly(studentId)
        setWeeklySchedule(response.data || null)
      } catch (err) {
        console.error('Error loading weekly schedule:', err)
        setError(err instanceof Error ? err.message : 'Failed to load weekly schedule')
        setWeeklySchedule(null)
      } finally {
        setLoading(false)
      }
    }

    loadWeeklySchedule()
  }, [studentId])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const response = await scheduleApi.getWeekly(studentId)
      setWeeklySchedule(response.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh weekly schedule')
    } finally {
      setLoading(false)
    }
  }

  return {
    weeklySchedule,
    loading,
    error,
    refresh
  }
}

