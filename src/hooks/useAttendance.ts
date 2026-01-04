// Attendance Hook
import { useState, useEffect } from 'react'
import { attendanceApi, type AttendanceRecord, type AttendanceStats, type AttendanceQueryParams } from '../services/api/attendanceApi'

export function useAttendance(
  studentId?: string,
  params?: AttendanceQueryParams
) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAttendance() {
      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [recordsResponse, statsResponse] = await Promise.all([
          attendanceApi.getByStudent(studentId, params),
          attendanceApi.getStats(studentId, params)
        ])

        setRecords(recordsResponse.data || [])
        setStats(statsResponse.data || null)
      } catch (err) {
        console.error('Error loading attendance:', err)
        setError(err instanceof Error ? err.message : 'Failed to load attendance data')
        setRecords([])
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    loadAttendance()
  }, [studentId, params?.startDate, params?.endDate, params?.status])

  const refresh = async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const [recordsResponse, statsResponse] = await Promise.all([
        attendanceApi.getByStudent(studentId, params),
        attendanceApi.getStats(studentId, params)
      ])

      setRecords(recordsResponse.data || [])
      setStats(statsResponse.data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh attendance data')
    } finally {
      setLoading(false)
    }
  }

  return {
    records,
    stats,
    loading,
    error,
    refresh
  }
}

