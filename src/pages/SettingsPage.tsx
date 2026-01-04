// Settings Page - Beautiful UI for parent account management
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../utils/apiClient'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useGradeMode } from '../context/GradeModeContext'
import { useStudents } from '../hooks/useStudents'
import { getGradeModeFromLevel, getGradeModeConfig, type GradeMode } from '../utils/gradeModeUtils'
import { DashboardPersonalizationSettings } from '../components/DashboardPersonalizationSettings'

interface SettingsPageProps {
  t: (key: string) => string
  locale: string
  onLocaleChange: (locale: string) => void
}

export function SettingsPage({ t, locale, onLocaleChange }: SettingsPageProps) {
  const { user, logout, refreshUser } = useAuth()

  // Initialize notification preferences from user data
  useEffect(() => {
    if (user?.preferences?.notifications) {
      setNotificationPrefs(user.preferences.notifications)
    }
  }, [user])
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'children' | 'security' | 'privacy'>('profile')
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
  }, [user])
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    grades: true,
    assignments: true,
    attendance: true,
    behavior: true,
    messages: true
  })
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const tabs = [
    { key: 'profile', label: t('profile'), icon: '👤' },
    { key: 'notifications', label: t('notifications'), icon: '🔔' },
    { key: 'dashboard', label: 'Dashboard Personalization', icon: '📊' },
    { key: 'children', label: t('myChildren'), icon: '👨‍👩‍👧‍👦' },
    { key: 'security', label: t('security') || 'Security', icon: '🔒' },
    { key: 'privacy', label: t('privacy') || 'Privacy', icon: '🛡️' }
  ]
  
  // Grade mode management
  const { students } = useStudents(user?._id)
  const selectedStudent = students?.[0] // Default to first student
  const gradeLevel = selectedStudent?.gradeLevel || 5
  const { config: gradeConfig, setMode: setGradeMode, resetMode } = useGradeMode(selectedStudent?._id, gradeLevel)
  
  const [selectedModeOverride, setSelectedModeOverride] = useState<GradeMode | 'auto'>(gradeConfig.isManualOverride ? gradeConfig.mode : 'auto')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{t('settings')}</h1>
          <p className="text-slate-600">{t('manageAccountPreferences')}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card padding="none" className="overflow-hidden">
              <nav className="p-2">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200
                      ${activeTab === tab.key
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('profileInformation')}</h2>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-slate-50"
                        value={profileData.email}
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Language Preference</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onLocaleChange('en')}
                          className={`
                            flex-1 px-4 py-2.5 rounded-xl font-medium transition-all
                            ${locale === 'en' 
                              ? 'bg-brand-500 text-white shadow-md' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }
                          `}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => onLocaleChange('ar')}
                          className={`
                            flex-1 px-4 py-2.5 rounded-xl font-medium transition-all
                            ${locale === 'ar' 
                              ? 'bg-brand-500 text-white shadow-md' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }
                          `}
                        >
                          العربية
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('address')}</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="Enter your address..."
                    />
                  </div>
                  {profileError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                      Profile updated successfully!
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit" 
                      onClick={async (e) => {
                      e.preventDefault()
                        if (!user?._id) {
                          setProfileError('User not found. Please log in again.')
                          return
                        }

                        setIsSavingProfile(true)
                        setProfileError(null)
                        setProfileSuccess(false)

                        try {
                          const response = await apiClient.put<{ success: boolean; data: any }>(`/users/${user._id}`, {
                            name: profileData.name,
                            phone: profileData.phone || undefined,
                            address: profileData.address || undefined
                            // Note: email cannot be changed via this endpoint per backend
                          })

                          if (response.success) {
                            setProfileSuccess(true)
                            // Refresh user data in context
                            await refreshUser()
                            // Clear success message after 3 seconds
                            setTimeout(() => setProfileSuccess(false), 3000)
                          }
                        } catch (error: any) {
                          console.error('Profile update error:', error)
                          setProfileError(error.message || 'Failed to update profile. Please try again.')
                        } finally {
                          setIsSavingProfile(false)
                        }
                      }}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? t('saving') : t('saveChanges')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                      setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: '',
                        address: ''
                      })
                        setProfileError(null)
                        setProfileSuccess(false)
                      }}
                      disabled={isSavingProfile}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Delivery Methods</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                        { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' }
                      ].map(pref => (
                        <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                          <div>
                            <div className="font-medium text-slate-900">{pref.label}</div>
                            <div className="text-sm text-slate-600">{pref.description}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                              onChange={(e) => setNotificationPrefs({
                                ...notificationPrefs,
                                [pref.key]: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'grades', label: 'New Grades', icon: '📊' },
                        { key: 'assignments', label: 'Assignments & Deadlines', icon: '📝' },
                        { key: 'attendance', label: 'Attendance Updates', icon: '📅' },
                        { key: 'behavior', label: 'Behavior Reports', icon: '📋' },
                        { key: 'messages', label: 'New Messages', icon: '💬' }
                      ].map(pref => (
                        <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{pref.icon}</span>
                            <div className="font-medium text-slate-900">{pref.label}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                              onChange={(e) => setNotificationPrefs({
                                ...notificationPrefs,
                                [pref.key]: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {preferencesError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                      {preferencesError}
                    </div>
                  )}
                  {preferencesSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                      Notification preferences saved successfully!
                    </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <Button 
                      onClick={async () => {
                        if (!user?._id) {
                          setPreferencesError('User not found. Please log in again.')
                          return
                        }

                        setIsSavingPreferences(true)
                        setPreferencesError(null)
                        setPreferencesSuccess(false)

                        try {
                          const response = await apiClient.put<{ success: boolean; data: any; message: string }>(
                            `/users/${user._id}/preferences`,
                            {
                              notifications: notificationPrefs
                            }
                          )

                          if (response.success) {
                            setPreferencesSuccess(true)
                            // Refresh user data in context
                            await refreshUser()
                            // Clear success message after 3 seconds
                            setTimeout(() => setPreferencesSuccess(false), 3000)
                          }
                        } catch (error: any) {
                          console.error('Preferences save error:', error)
                          setPreferencesError(error.message || 'Failed to save preferences. Please try again.')
                        } finally {
                          setIsSavingPreferences(false)
                        }
                      }}
                      disabled={isSavingPreferences}
                    >
                      {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Change Password</h3>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        />
                      </div>
                      {passwordError && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                          Password changed successfully!
                        </div>
                      )}
                      <Button 
                        onClick={async (e) => {
                        e.preventDefault()
                          
                          if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
                            setPasswordError('Please fill in all password fields')
                            return
                          }

                          if (passwordData.new !== passwordData.confirm) {
                            setPasswordError('New passwords do not match')
                            return
                          }

                          if (passwordData.new.length < 6) {
                            setPasswordError('New password must be at least 6 characters long')
                            return
                          }

                          setIsChangingPassword(true)
                          setPasswordError(null)
                          setPasswordSuccess(false)

                          try {
                            const response = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', {
                              currentPassword: passwordData.current,
                              newPassword: passwordData.new
                            })

                            if (response.success) {
                              setPasswordSuccess(true)
                              // Clear form
                              setPasswordData({
                                current: '',
                                new: '',
                                confirm: ''
                              })
                              // Clear success message after 3 seconds
                              setTimeout(() => setPasswordSuccess(false), 3000)
                            }
                          } catch (error: any) {
                            console.error('Password change error:', error)
                            setPasswordError(error.message || 'Failed to change password. Please check your current password and try again.')
                          } finally {
                            setIsChangingPassword(false)
                          }
                        }}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? 'Changing Password...' : 'Update Password'}
                      </Button>
                    </form>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                        <div>
                          <div className="font-medium text-slate-900">Current Session</div>
                          <div className="text-sm text-slate-600">This device • {new Date().toLocaleString()}</div>
                        </div>
                        <Badge variant="success" size="sm">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Dashboard Personalization Tab */}
            {activeTab === 'dashboard' && selectedStudent && (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Personalization</h2>
                <p className="text-slate-600 mb-6">
                  Customize your dashboard experience. The system adapts to your preferences while using your child's grade level as a starting point.
                </p>
                <DashboardPersonalizationSettings
                  studentId={selectedStudent._id}
                  gradeLevel={gradeLevel}
                  t={t}
                />
              </Card>
            )}
            
            {activeTab === 'dashboard' && !selectedStudent && (
              <Card>
                <div className="text-center py-12">
                  <p className="text-slate-600">Please select a student to customize dashboard settings.</p>
                </div>
              </Card>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Privacy & Data</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Data Collection</h3>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        We collect and process the following data to provide you with the best educational monitoring experience:
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc list-inside">
                        <li>Student academic records (grades, assignments, attendance)</li>
                        <li>Behavioral reports and teacher notes</li>
                        <li>Communication history with teachers</li>
                        <li>Account information and preferences</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Your Rights</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Access your data', description: 'Request a copy of all your data' },
                        { label: 'Data portability', description: 'Export your data in a machine-readable format' },
                        { label: 'Data deletion', description: 'Request deletion of your account and data' },
                        { label: 'Opt-out of analytics', description: 'Disable data collection for analytics' }
                      ].map((right, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                          <div>
                            <div className="font-medium text-slate-900">{right.label}</div>
                            <div className="text-sm text-slate-600">{right.description}</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Request
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

