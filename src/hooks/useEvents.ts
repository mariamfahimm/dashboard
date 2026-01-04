// Events Hook
import { useState, useEffect } from 'react'
import { eventsApi, type Event } from '../services/api/eventsApi'

export function useEvents(params?: {
  studentId?: string
  startDate?: string
  endDate?: string
  type?: string
}) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await eventsApi.getAll(params)
        const eventsData = response.data || []
        
        setEvents(eventsData)
      } catch (err) {
        console.error('Error loading events:', err)
        setError(err instanceof Error ? err.message : 'Failed to load events')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [params?.studentId, params?.startDate, params?.endDate, params?.type])

  const refresh = async () => {
    try {
      setLoading(true)
      const response = await eventsApi.getAll(params)
      const eventsData = response.data || []
      setEvents(eventsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh events')
    } finally {
      setLoading(false)
    }
  }

  return {
    events,
    loading,
    error,
    refresh
  }
}

