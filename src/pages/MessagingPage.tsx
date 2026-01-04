// Messaging & Communication Page - Beautiful UI for parent-teacher communication
import React, { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../utils/apiClient'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/EmptyState'
import { FileUpload, type FileAttachment } from '../components/ui/FileUpload'
import { messagesApi } from '../services/api/messagesApi'
import { useMessages } from '../hooks/useMessages'

interface MessagingPageProps {
  selectedStudentId?: string | null
  t: (key: string) => string
  locale: string
}

interface Message {
  _id: string
  from: {
    _id: string
    name: string
    role: string
    avatar?: string
  }
  to: {
    _id: string
    name: string
    role: string
  }
  subject: string
  message: string
  timestamp: string
  read: boolean
  attachments?: Array<{ name: string; url: string }>
  studentId?: string
}

interface User {
  _id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
}

export function MessagingPage({ selectedStudentId, t, locale }: MessagingPageProps) {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'teachers' | 'admin'>('all')
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', message: '' })
  const [showCompose, setShowCompose] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Get real messages from API
  const { messages: apiMessages, loading, unreadCount, refresh } = useMessages(selectedStudentId)

  // Fetch available users (teachers and admins) when compose modal opens
  useEffect(() => {
    if (showCompose && availableUsers.length === 0) {
      const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
          // Fetch teachers and admins separately, then combine
          const [teachersResponse, adminsResponse] = await Promise.all([
            apiClient.get<{ success: boolean; data: User[] }>('/users', { role: 'teacher' }),
            apiClient.get<{ success: boolean; data: User[] }>('/users', { role: 'admin' })
          ])

          const teachers = teachersResponse.data || []
          const admins = adminsResponse.data || []
          setAvailableUsers([...teachers, ...admins])
        } catch (error) {
          console.error('Failed to fetch users:', error)
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchUsers()
    }
  }, [showCompose, availableUsers.length])
  
  // Transform API messages to component format
  const messages: Message[] = useMemo(() => {
    if (!apiMessages) return []
    return apiMessages.map(msg => ({
      _id: msg._id,
      from: {
        _id: msg.from.userId,
        name: msg.from.name,
        role: msg.from.role,
        avatar: msg.from.avatar
      },
      to: {
        _id: msg.to.userId,
        name: msg.to.name,
        role: msg.to.role
      },
      subject: msg.subject,
      message: msg.content,
      timestamp: msg.createdAt,
      read: msg.read,
      attachments: msg.attachments?.map((url, idx) => ({
        name: url.split('/').pop() || `attachment-${idx + 1}`,
        url: url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000'}${url}`
      })),
      studentId: msg.studentId
    }))
  }, [apiMessages])

  const filteredMessages = useMemo(() => {
    let filtered = messages
    
    if (filter === 'unread') {
      filtered = filtered.filter(m => !m.read)
    } else if (filter === 'teachers') {
      filtered = filtered.filter(m => m.from.role === 'teacher')
    } else if (filter === 'admin') {
      filtered = filtered.filter(m => m.from.role === 'admin')
    }
    
    return filtered.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [messages, filter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-slate-600">{t('loadingMessages')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('messages')}</h1>
              <p className="text-slate-600">
                {unreadCount > 0 
                  ? `${unreadCount} ${unreadCount !== 1 ? t('unreadNotifications') : t('unreadNotification')}`
                  : t('allMessagesRead') || 'All messages read'
                }
              </p>
            </div>
            <Button
              onClick={() => setShowCompose(true)}
              leftIcon="✉️"
            >
              {t('newMessage') || 'New Message'}
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: t('all'), count: messages.length },
              { key: 'unread', label: t('unread'), count: unreadCount },
              { key: 'teachers', label: t('teachers'), count: messages.filter(m => m.from.role === 'teacher').length },
              { key: 'admin', label: t('administration'), count: messages.filter(m => m.from.role === 'admin').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200
                  ${filter === tab.key
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-soft'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                    ${filter === tab.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-brand-100 text-brand-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card padding="none" className="overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-brand-50 to-white">
                <h2 className="font-semibold text-slate-900">{t('conversations')}</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center">
                    <EmptyState
                      icon="💬"
                      title={t('noMessages')}
                      message="You don't have any messages yet."
                      className="p-0"
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredMessages.map((message) => (
                      <div
                        key={message._id}
                        onClick={() => setSelectedConversation(message._id)}
                        className={`
                          p-4 cursor-pointer transition-all duration-200
                          ${selectedConversation === message._id 
                            ? 'bg-brand-50 border-l-4 border-l-brand-500' 
                            : 'hover:bg-slate-50'
                          }
                          ${!message.read ? 'bg-blue-50/50' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0
                            ${message.from.role === 'teacher' 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                              : 'bg-gradient-to-br from-slate-500 to-slate-600'
                            }
                          `}>
                            {message.from.avatar ? (
                              <img src={message.from.avatar} alt={message.from.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              message.from.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`
                                font-semibold truncate
                                ${!message.read ? 'text-slate-900' : 'text-slate-700'}
                              `}>
                                {message.from.name}
                              </h3>
                              {!message.read && (
                                <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 truncate mb-1">
                              {message.subject}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" size="sm">
                                {message.from.role}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(message.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card>
                {(() => {
                  const message = messages.find(m => m._id === selectedConversation)
                  if (!message) return null
                  
                  return (
                    <>
                      <div className="border-b border-slate-200 pb-4 mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`
                              h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white
                              ${message.from.role === 'teacher' 
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                : 'bg-gradient-to-br from-slate-500 to-slate-600'
                              }
                            `}>
                              {message.from.avatar ? (
                                <img src={message.from.avatar} alt={message.from.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                message.from.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">{message.from.name}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="info" size="sm">{message.from.role}</Badge>
                                <span className="text-sm text-slate-500">
                                  {new Date(message.timestamp).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Reply
                          </Button>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{message.subject}</h3>
                      </div>
                      
                      <div className="prose max-w-none mb-6">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="border-t border-slate-200 pt-4">
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span>📎</span>
                            Attachments ({message.attachments.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {message.attachments.map((attachment, idx) => {
                              const getFileIcon = (url: string) => {
                                const ext = url.split('.').pop()?.toLowerCase()
                                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️'
                                if (ext === 'pdf') return '📄'
                                if (['doc', 'docx'].includes(ext || '')) return '📝'
                                if (['xls', 'xlsx'].includes(ext || '')) return '📊'
                                if (['txt', 'csv'].includes(ext || '')) return '📋'
                                return '📎'
                              }
                              
                              return (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 transition-all group"
                                >
                                  <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    {getFileIcon(attachment.url)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{attachment.name}</p>
                                    <p className="text-xs text-slate-500">{t('clickToDownload')}</p>
                                  </div>
                                  <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                        <Button variant="primary">
                          Reply
                        </Button>
                        <Button variant="outline">
                          Forward
                        </Button>
                        <Button variant="ghost">
                          Archive
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </Card>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <EmptyState
                  icon="💬"
                  title={t('selectAMessage')}
                  message={t('chooseConversation')}
                  className="p-0"
                />
              </Card>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t('composeMessage')}</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('to')}</label>
                  {loadingUsers ? (
                    <div className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-500">
                      Loading recipients...
                    </div>
                  ) : (
                  <select
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    value={newMessage.to}
                    onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                    required
                  >
                    <option value="">Select recipient...</option>
                      {availableUsers.map((recipient) => (
                        <option key={recipient._id} value={recipient._id}>
                          {recipient.name} ({recipient.role === 'teacher' ? t('teacher') : t('administrator')})
                        </option>
                      ))}
                      {availableUsers.length === 0 && (
                        <option value="" disabled>No recipients available</option>
                      )}
                  </select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder={t('messageSubject')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('message')}</label>
                  <textarea
                    rows={8}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    placeholder={t('typeYourMessage')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
                  <FileUpload
                    files={attachments}
                    onFilesChange={setAttachments}
                    maxFiles={5}
                    maxSizeMB={10}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    onClick={async (e) => {
                      e.preventDefault()
                      if (!newMessage.to || !newMessage.subject || !newMessage.message) {
                        alert('Please fill in all required fields')
                        return
                      }

                      setSending(true)
                      try {
                        // Find the selected recipient user
                        const recipient = availableUsers.find(u => u._id === newMessage.to)
                        if (!recipient) {
                          alert('Please select a valid recipient')
                          setSending(false)
                          return
                        }

                        await messagesApi.create({
                          to: {
                            userId: recipient._id,
                            name: recipient.name,
                            role: recipient.role as 'parent' | 'teacher' | 'admin'
                          },
                          studentId: selectedStudentId || undefined,
                          subject: newMessage.subject,
                          content: newMessage.message,
                          attachments: attachments.map(f => f.file)
                        })

                        // Reset form
                        setNewMessage({ to: '', subject: '', message: '' })
                        setAttachments([])
                        setShowCompose(false)
                        await refresh() // Refresh messages list
                      } catch (error: any) {
                        alert(`Failed to send message: ${error.message || 'Unknown error'}`)
                      } finally {
                        setSending(false)
                      }
                    }}
                    disabled={sending}
                  >
                    {sending ? t('sending') : t('sendMessage')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCompose(false)
                      setNewMessage({ to: '', subject: '', message: '' })
                      setAttachments([])
                    }}
                    disabled={sending}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

