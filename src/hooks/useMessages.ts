// Messages Hook
import { useState, useEffect } from 'react'
import { messagesApi, type Message } from '../services/api/messagesApi'

export function useMessages(studentId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true)
        setError(null)

        const response = await messagesApi.getAll({ studentId })
        const messagesData = response.data || []
        const unread = response.unreadCount || 0

        setMessages(messagesData)
        setUnreadCount(unread)
      } catch (err) {
        console.error('Error loading messages:', err)
        setError(err instanceof Error ? err.message : 'Failed to load messages')
        setMessages([])
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [studentId])

  const refresh = async () => {
    try {
      setLoading(true)
      const response = await messagesApi.getAll({ studentId })
      const messagesData = response.data || []
      const unread = response.unreadCount || 0

      setMessages(messagesData)
      setUnreadCount(unread)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh messages')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await messagesApi.markAsRead(messageId)
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, read: true, readAt: new Date().toISOString() } : msg
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  return {
    messages,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead
  }
}

