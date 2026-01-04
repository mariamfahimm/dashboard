import React, { useState } from 'react'
import { createT } from './i18n'
import AcademicProgress from './pages/AcademicProgress'
import { useAuth } from './context/AuthContext'
import { GradeModeProvider } from './context/GradeModeContext'
import { UserAdaptiveProvider } from './context/UserAdaptiveContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './components/Login'
import { useStudents } from './hooks/useStudents'
import { useAssignments } from './hooks/useAssignments'
import { useGrades } from './hooks/useGrades'
import { useCourses } from './hooks/useCourses'
import { EmptyState } from './components/EmptyState'
import { AdminDemo } from './components/AdminDemo'
import { AdminSidebar } from './components/AdminSidebar'
import { StudentSelection } from './components/StudentSelection'
import { NotificationsCenter } from './pages/NotificationsCenter'
import { DetailedGradebook } from './pages/DetailedGradebook'
import { AttendanceBehavior } from './pages/AttendanceBehavior'
import { ChildrenManagement } from './pages/ChildrenManagement'
import { CalendarPage } from './pages/CalendarPage'
import { MessagingPage } from './pages/MessagingPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimetablePage } from './pages/TimetablePage'
import { FeesPage } from './pages/FeesPage'
import LearningInsights from './pages/LearningInsights'
import { realtimeService, useRealtime } from './services/realtimeService'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { DashboardSkeleton, CardSkeleton, ListSkeleton } from './components/ui/Skeleton'
import { Card } from './components/ui/Card'
import { Badge } from './components/ui/Badge'
import { PageTransition } from './components/ui/PageTransition'
import { useMessages } from './hooks/useMessages'
import { useNotices } from './hooks/useNotices'
import { useGlobalSearch } from './hooks/useGlobalSearch'
import { SearchResults } from './components/ui/SearchResults'
import { useAllAssignmentCompletions } from './hooks/useAssignmentCompletion'
import { useAttendance } from './hooks/useAttendance'
import { getStudentDisplayName } from './utils/nameUtils'
import { QuickStatsBar } from './components/dashboard/QuickStatsBar'
import { QuickActionsPanel } from './components/dashboard/QuickActionsPanel'
import { TabNavigation } from './components/dashboard/TabNavigation'
import { TodaySchedule } from './components/dashboard/TodaySchedule'
import { UpcomingAssignments } from './components/dashboard/UpcomingAssignments'
import { CollapsibleSection } from './components/dashboard/CollapsibleSection'
import {
  HiHome,
  HiUsers,
  HiChartBar,
  HiBookOpen,
  HiCalendar,
  HiBell,
  HiCog,
  HiChat,
  HiLogout,
  HiCurrencyDollar,
  HiRefresh,
  HiAcademicCap,
  HiMenu,
  HiSearch,
  HiX,
  HiChevronRight,
  HiLightBulb
} from 'react-icons/hi'

function Sidebar({ t, onNavigate, current, onLogout, onSwitchStudent }) {
  const links = [
    { label: t('dashboard'), hash: '#/', icon: HiHome },
    { label: t('myChildren'), hash: '#/children', icon: HiUsers },
    { label: t('academicProgress'), hash: '#/progress', icon: HiChartBar },
    { label: t('gradebook'), hash: '#/gradebook', icon: HiBookOpen },
    { label: t('learningInsights'), hash: '#/insights', icon: HiLightBulb },
    { label: t('attendance'), hash: '#/attendance', icon: HiCalendar },
    { label: t('timetable'), hash: '#/timetable', icon: HiCalendar },
    { label: t('feesPayments'), hash: '#/fees', icon: HiCurrencyDollar },
    { label: t('notifications'), hash: '#/notifications', icon: HiBell },
    { label: t('calendar'), hash: '#/calendar', icon: HiCalendar },
    { label: t('communicationHub'), hash: '#/messages', icon: HiChat },
    { label: t('settings'), hash: '#/settings', icon: HiCog }
  ]

  const isActive = (hash, idx) => {
    return current === hash || (!current && idx === 0 && hash === '#/')
  }

  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-3xl m-3 p-4 flex flex-col shadow-xl">
      {/* Logo */}
      <a 
        href="#/" 
        onClick={(e)=>{ e.preventDefault(); onNavigate('#/') }}
        className="flex items-center gap-3 px-3 py-4 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer group"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg group-hover:scale-105 transition-transform">
          <HiAcademicCap className="w-6 h-6 text-white" />
        </div>
        <div className="font-bold text-lg">EduConnect</div>
      </a>

      {/* Navigation */}
      <nav className="mt-6 grid gap-1 flex-1">
        {links.map((l, idx) => {
          const active = isActive(l.hash || '', idx)
          const Icon = l.icon || HiHome
          
          return (
            <a
              key={l.label}
              href={l.hash || '#'}
              onClick={(e)=>{ 
                e.preventDefault()
                if(l.hash){ 
                  onNavigate(l.hash)
                }
              }}
              className={`
                px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer 
                flex items-center gap-3 text-sm font-medium
                ${active 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }
                group
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
              <span className="flex-1">{l.label}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </a>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-4 space-y-2 border-t border-white/10">
        {onSwitchStudent && (
          <button 
            onClick={onSwitchStudent}
            className="w-full bg-slate-700/50 text-white rounded-xl py-2.5 text-sm hover:bg-slate-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
          >
            <HiRefresh className="w-4 h-4" />
            <span>{t('switchStudent')}</span>
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full bg-white/10 text-white rounded-xl py-2.5 text-sm hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
        >
          <HiLogout className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  )
}

function Topbar({ onMenuClick, locale, onToggleLocale, t, currentRoute, onNavigate, user, onLogout, selectedStudentId }) {
  const isDashboard = currentRoute === '#/' || !currentRoute
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showSearchResults, setShowSearchResults] = React.useState(false)
  const searchInputRef = React.useRef(null)
  // Get unread count - useMessages can work without selectedStudentId for unread count
  const { unreadCount } = useMessages(undefined) // Pass undefined if no student selected yet
  
  // Use global search hook
  const { results: searchResults, loading: searchLoading } = useGlobalSearch(searchQuery, selectedStudentId)
  
  // Close search results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Show search results when query changes
  React.useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }, [searchQuery])
  
  const handleSearchSelect = (result) => {
    if (result.route) {
      onNavigate(result.route)
    }
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const getBreadcrumbs = () => {
    const routeMap = {
      '#/children': [{ label: t('dashboard'), hash: '#/' }, { label: t('myChildren') }],
      '#/progress': [{ label: t('dashboard'), hash: '#/' }, { label: t('academicProgress') }],
      '#/gradebook': [{ label: t('dashboard'), hash: '#/' }, { label: t('gradebook') }],
      '#/attendance': [{ label: t('dashboard'), hash: '#/' }, { label: t('attendance') }],
      '#/notifications': [{ label: t('dashboard'), hash: '#/' }, { label: t('notifications') }],
      '#/calendar': [{ label: t('dashboard'), hash: '#/' }, { label: t('calendar') }],
      '#/messages': [{ label: t('dashboard'), hash: '#/' }, { label: t('messages') }],
      '#/settings': [{ label: t('dashboard'), hash: '#/' }, { label: t('settings') }],
      '#/admin': [{ label: 'Admin Dashboard', hash: '#/admin' }],
      '#/admin/students': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Students & Grades' }],
      '#/admin/courses': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Courses' }],
      '#/admin/parents': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Parent Accounts' }],
      '#/admin/assignments': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Assignments' }],
      '#/admin/alerts': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Alerts' }],
      '#/admin/messages': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Messages' }],
      '#/admin/fees': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Fees' }],
      '#/admin/events': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Events' }],
      '#/admin/analytics': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Analytics' }],
      '#/admin/insights': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Insights' }],
      '#/admin/notifications': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Notifications' }],
      '#/admin/settings': [{ label: 'Admin Dashboard', hash: '#/admin' }, { label: 'Settings' }],
    }
    return routeMap[currentRoute] || []
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden h-10 w-10 rounded-xl bg-white shadow-soft grid place-items-center hover:bg-slate-50 transition-colors" 
        onClick={onMenuClick} 
        aria-label="Open menu"
      >
        <HiMenu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Back Button (if not on dashboard) */}
      {!isDashboard && (
        <button 
          onClick={() => onNavigate('#/')} 
          className="h-10 px-3 rounded-xl bg-white shadow-soft text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors font-medium text-slate-700"
        >
          <HiHome className="w-4 h-4" />
          <span>{t('dashboard')}</span>
        </button>
      )}

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="hidden md:flex items-center gap-2 text-sm text-slate-600">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <HiChevronRight className="w-4 h-4 text-slate-400" />}
              {crumb.hash ? (
                <a
                  href={crumb.hash}
                  onClick={(e) => {
                    e.preventDefault()
                    if (crumb.hash) {
                      onNavigate(crumb.hash)
                    }
                  }}
                  className="hover:text-slate-900 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-900 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-xl" ref={searchInputRef}>
        <div className="flex items-center gap-2 bg-white shadow-soft rounded-xl px-4 h-10 w-full border border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          <HiSearch className="w-4 h-4 text-slate-400" />
          <input 
            className="outline-none w-full text-sm bg-transparent" 
            placeholder={t('search') || 'Search students, grades, assignments, messages...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowSearchResults(true)
              }
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowSearchResults(false)
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>
        {showSearchResults && searchQuery.trim().length >= 2 && (
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            onSelect={handleSearchSelect}
            onClose={() => setShowSearchResults(false)}
          />
        )}
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language Toggle */}
        <button 
          onClick={onToggleLocale} 
          className="h-10 px-3 rounded-xl bg-white shadow-soft text-xs font-medium hover:bg-slate-50 transition-colors text-slate-700"
        >
          {locale==='ar' ? 'AR • العربية' : 'EN • English'}
        </button>

        {/* Notifications */}
        <button 
          className="h-10 w-10 rounded-xl bg-white shadow-soft grid place-items-center hover:bg-slate-50 transition-colors relative"
          onClick={() => onNavigate('#/notifications')}
        >
          <HiBell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button 
          className="h-10 w-10 rounded-xl bg-white shadow-soft grid place-items-center hover:bg-slate-50 transition-colors"
          onClick={() => onNavigate('#/settings')}
        >
          <HiCog className="w-5 h-5 text-slate-700" />
        </button>

        {/* User Avatar/Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-900">{user?.name || t('user')}</div>
                <div className="text-xs text-slate-500">{user?.email || ''}</div>
              </div>
              <a
                href="#/settings"
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate('#/settings')
                  setShowUserMenu(false)
                }}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Settings
              </a>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  if (onLogout) {
                    onLogout()
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}

function KPI({ value, label, color='text-brand-600', localizeDigits }) {
  return (
    <div className="rounded-xl bg-white shadow-soft px-4 py-3 transition-shadow hover:shadow-md">
      <div className={`metric-value ${color}`}>{localizeDigits ? localizeDigits(value) : value}</div>
      <div className="metric-label mt-1">{label}</div>
    </div>
  )
}

function WelcomeCard({ t, localizeDigits, parentName, onViewProgress, locale }) {
  const isRTL = locale === 'ar'
  return (
    <Card className="col-span-12 md:col-span-7 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100" padding="lg">
      <div>
        <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎓</span>
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {parentName ? `${t('hey') || 'Hey'} ${parentName.split(' ')[0]}!` : t('heyMariam')}
            </h2>
            <p className="text-slate-600 text-sm">{t('welcomeBack') || t('welcome')}</p>
          </div>
        </div>
        {onViewProgress && (
          <button
            onClick={onViewProgress}
            className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
          >
            {t('viewFullProgress') || 'View Full Progress'} {isRTL ? '←' : '→'}
          </button>
        )}
      </div>
    </Card>
  )
}

function AttendanceCard({ t, localizeDigits }) {
  return (
    <Card className="col-span-12 md:col-span-2 flex flex-col items-center" padding="md">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="font-semibold">{t('attendance')}</h3>
        <span>⋮</span>
      </div>
      <svg viewBox="0 0 120 120" className="w-36 h-36">
        <circle cx="60" cy="60" r="52" className="stroke-slate-200" strokeWidth="12" fill="none" />
        <circle cx="60" cy="60" r="52" className="stroke-brand-500" strokeWidth="12" fill="none" strokeDasharray="327" strokeDashoffset="65" strokeLinecap="round" />
        <text x="60" y="66" textAnchor="middle" className="fill-slate-700 font-semibold">{localizeDigits ? localizeDigits('80%') : '80%'}</text>
      </svg>
      <div className="mt-2 text-xs text-slate-500">{t('attendanceLegend')}</div>
    </Card>
  )
}

function CalendarCard({ t, locale, localizeDigits }) {
  const days = ['S','M','T','W','T','F','S']
  const cells = [29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,'18*',19,20,21,22,23,24,25,26,27,28,29,30,1,2,3]
  return (
    <Card className="col-span-12 md:col-span-3" padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{t('september')} 2021</h3>
        <div className="flex gap-2"><button className="chip">‹</button><button className="chip">›</button></div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {(t('weekdaysShort') || days).map((d, i) => <div key={i} className="text-slate-500">{d}</div>)}
        {cells.map((n,i)=>{
          const muted = (i<2 || i>33)
          const today = n==='18*'
          const val = today? '18' : n
          return (
            <div key={i} className={`h-8 grid place-items-center rounded-lg ${today? 'bg-brand-100 text-brand-700 ring-1 ring-brand-400' : muted? 'text-slate-300' : 'bg-slate-50'}`}>{localizeDigits ? localizeDigits(val) : val}</div>
          )
        })}
      </div>
    </Card>
  )
}

function NoticeBoard({ t, locale, selectedStudentId }) {
  const { notices, loading, error } = useNotices(selectedStudentId)

  const getNoticeColor = (type, priority) => {
    if (priority === 'urgent') return 'bg-rose-50 text-rose-700'
    if (priority === 'high') return 'bg-orange-50 text-orange-700'
    if (type === 'event') return 'bg-blue-50 text-blue-700'
    if (type === 'alert') return 'bg-amber-50 text-amber-700'
    return 'bg-emerald-50 text-emerald-700'
  }

  const getNoticeTag = (type) => {
    const tags = {
      announcement: 'Announcement',
      event: 'Event',
      alert: 'Alert',
      info: 'Info',
      reminder: 'Reminder'
    }
    return tags[type] || 'Info'
  }

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-4" padding="md">
        <h3 className="font-semibold mb-3">{t('noticeBoard')}</h3>
        <ListSkeleton items={3} />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-12 md:col-span-4" padding="md">
        <h3 className="font-semibold mb-3">{t('noticeBoard')}</h3>
        <div className="text-sm text-rose-600">{t('errorLoadingNotices')}: {error}</div>
      </Card>
    )
  }

  if (!notices || notices.length === 0) {
    return (
      <Card className="col-span-12 md:col-span-4" padding="md">
        <h3 className="font-semibold mb-3">{t('noticeBoard')}</h3>
        <EmptyState
          icon="📋"
          title={t('noNotices')}
          message={t('noNoticesMessage')}
        />
      </Card>
    )
  }

  return (
    <Card className="col-span-12 md:col-span-4" padding="md">
      <h3 className="font-semibold mb-3">{t('noticeBoard')}</h3>
      <div className="grid gap-2">
        {notices.map((notice) => (
          <div key={notice._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <span className={`chip ${getNoticeColor(notice.type, notice.priority)}`}>
              {getNoticeTag(notice.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{notice.title}</div>
              <div className="text-xs text-slate-500">
                {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { calendar: 'gregory' }) : (t('recent') || 'Recent')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LineChartCard({ t }) {
  return (
    <Card className="col-span-12 md:col-span-6" padding="md">
      <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{t('testScoreActivity')}</h3><span className="chip">{t('monthly')}</span></div>
      <svg viewBox="0 0 640 220" className="w-full">
        <path d="M20 180 C 80 120, 120 160, 180 130 S 300 150, 360 110 480 160, 620 90" className="fill-none stroke-brand-500" strokeWidth="4" />
        <line x1="20" y1="180" x2="620" y2="180" className="stroke-slate-200" strokeWidth="2" />
      </svg>
    </Card>
  )
}

function GradesCard({ t, locale, grades, courses, loading }) {
  const translateSubject = (name) => {
    const map = {
      'Math': t('subjectMath'),
      'Science': t('subjectScience'),
      'English': t('subjectEnglish'),
      'Biology': t('subjectBiology'),
      'Chemistry': t('subjectChemistry'),
      'Physics': t('subjectPhysics'),
      'History': t('subjectHistory'),
      'EVS': t('subjectEVS'),
      'Social': t('subjectSocial'),
      'CS': t('subjectCS')
    }
    return map[name] || name
  }

  // Calculate average grade per subject
  const subjectGrades = React.useMemo(() => {
    if (!grades || !courses) return []
    
    const subjectMap = new Map()
    
    grades.forEach(grade => {
      const course = courses.find(c => c._id === grade.courseId)
      if (course) {
        const subject = course.subject
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, [])
        }
        subjectMap.get(subject).push(grade.percentage)
      }
    })
    
    return Array.from(subjectMap.entries())
      .map(([subject, percentages]) => ({
        subject,
        average: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5) // Top 5 subjects
  }, [grades, courses])

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-6" padding="md">
        <h3 className="font-semibold mb-3">{t('gradeBySubject')}</h3>
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-3 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="col-span-7 h-3 bg-slate-200 rounded animate-pulse" />
              <div className="col-span-2 h-4 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (subjectGrades.length === 0 && !loading) {
    return (
      <Card className="col-span-12 md:col-span-6" padding="md">
        <h3 className="font-semibold mb-3">{t('gradeBySubject')}</h3>
        <EmptyState
          icon="📊"
          title={t('noGrades') || 'No Grades Available'}
          message={t('noGradesMessage') || 'No grades have been recorded yet. Grades will appear here once assignments are graded.'}
          className="p-4"
        />
      </Card>
    )
  }

  return (
    <Card className="col-span-12 md:col-span-6" padding="md">
      <h3 className="font-semibold mb-3">{t('gradeBySubject')}</h3>
      <div className="grid gap-3">
        {subjectGrades.map(({ subject, average }) => (
          <div key={subject} className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-3 text-sm text-slate-600">{locale === 'ar' ? translateSubject(subject) : subject}</span>
            <div className="col-span-7 h-3 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-brand-500" style={{ width: Math.min(average, 100)+'%' }} />
            </div>
            <em className="col-span-2 not-italic text-xs text-slate-500">{average}%</em>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ResourcesCard({ t }) {
  const items = [ ['📚',t('books')], ['🎬',t('videos')], ['📄',t('papers')] ]
  return (
    <div className="col-span-12">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">{t('resources')}</h3><span className="chip">{t('viewAll')}</span></div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(([ico, label]) => (
          <div key={label} className="rounded-2xl bg-slate-50 py-6 grid place-items-center">
            <div className="text-2xl">{ico}</div>
            <div className="text-xs text-slate-600 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleCard({ t, locale, courses, loading }) {
  const translateSubject = (name) => {
    const map = {
      'Math': t('subjectMath'),
      'Science': t('subjectScience'),
      'English': t('subjectEnglish'),
      'Biology': t('subjectBiology'),
      'Chemistry': t('subjectChemistry'),
      'Physics': t('subjectPhysics'),
      'History': t('subjectHistory'),
      'EVS': t('subjectEVS'),
      'Social': t('subjectSocial'),
      'CS': t('subjectCS')
    }
    return map[name] || name
  }

  if (loading) {
    return (
      <div className="card col-span-12 md:col-span-3">
        <h3 className="font-semibold mb-3">{t('monday')}</h3>
        <ul className="grid gap-2">
          {[1, 2, 3, 4].map(i => (
            <li key={i}><div className="h-6 bg-slate-200 rounded-lg animate-pulse" /></li>
          ))}
        </ul>
      </div>
    )
  }

  const courseList = courses?.slice(0, 8) || []
  
  if (!loading && courseList.length === 0) {
    return (
      <div className="card col-span-12 md:col-span-3">
        <h3 className="font-semibold mb-3">{t('monday')}</h3>
        <EmptyState
          icon="📅"
          title={t('noCourses') || 'No Courses Scheduled'}
          message={t('noCoursesMessage') || 'No courses are scheduled for this student.'}
          className="p-4"
        />
      </div>
    )
  }
  
  return (
    <div className="card col-span-12 md:col-span-3">
      <h3 className="font-semibold mb-3">{t('monday')}</h3>
      <ul className="grid gap-2">
        {courseList.map((course, idx) => (
          <li key={course._id || idx}>
            <span className="text-xs px-3 py-1 rounded-lg bg-slate-100">
              {locale === 'ar' ? translateSubject(course.subject) : course.subject}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AssignmentsTable({ t, locale, localizeDigits, assignments, loading, error, selectedStudentId, predictions }) {
  const translateSubject = (name) => {
    const map = {
      'English': t('subjectEnglish'),
      'Maths': t('subjectMath'),
      'Math': t('subjectMath'),
      'Chemistry': t('subjectChemistry'),
      'EVS': t('subjectEVS'),
      'Science': t('subjectScience'),
      'History': t('subjectHistory'),
      'Social': t('subjectSocial'),
      'CS': t('subjectCS')
    }
    return map[name] || name
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      calendar: 'gregory', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const statusClass = (s) => {
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700'
    if (s === 'cancelled') return 'bg-rose-50 text-rose-700'
    return 'bg-amber-50 text-amber-800'
  }

  const getStatusLabel = (s) => {
    if (s === 'completed') return t('completed')
    if (s === 'cancelled') return t('cancelled') || 'Cancelled'
    return t('inProgress')
  }

  if (loading) {
    return (
      <Card className="col-span-12" padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('assignments')}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-12" padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('assignments')}</h3>
        </div>
        <div className="text-sm text-rose-600 p-4 bg-rose-50 rounded-lg">
          {error}
        </div>
      </Card>
    )
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="col-span-12" padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('assignments')}</h3>
        </div>
        <EmptyState
          icon="📝"
          title={t('noAssignments') || 'No Assignments'}
          message={t('noAssignmentsMessage') || 'No assignments have been assigned yet. New assignments will appear here when they are created.'}
          className="p-4"
        />
      </Card>
    )
  }

  return (
    <Card className="col-span-12" padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{t('assignments')}</h3>
        <input className="bg-slate-50 rounded-lg h-9 px-3 text-sm" placeholder={t('search')} />
      </div>
      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${locale === 'ar' ? 'text-right' : 'text-left'} text-slate-500 border-b border-slate-200`}>
              <th className="py-3 px-3 font-semibold">{t('no')}</th>
              <th className="py-3 px-3 font-semibold">{t('task')}</th>
              <th className="py-3 px-3 font-semibold">{t('subject')}</th>
              <th className="py-3 px-3 font-semibold">{t('dueDate')}</th>
              <th className="py-3 px-3 font-semibold">{t('status')}</th>
              <th className="py-3 px-3 font-semibold">{t('risk')}</th>
              <th className="py-3 px-3 font-semibold">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment, idx) => {
              const prediction = predictions?.find(p => p.assignmentId === assignment._id)
              
              return (
                <tr key={assignment._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${prediction && prediction.riskLevel === 'critical' ? 'bg-red-50/50' : prediction && prediction.riskLevel === 'high' ? 'bg-orange-50/30' : ''}`}>
                  <td className={`py-3 px-3 text-slate-500 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{localizeDigits ? localizeDigits(String(idx + 1).padStart(2, '0')) : String(idx + 1).padStart(2, '0')}</td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2">
                      <span>{assignment.title}</span>
                      {prediction && prediction.riskLevel === 'critical' && (
                        <span className="text-red-500" title={t('criticalRisk')}>🔴</span>
                      )}
                      {prediction && prediction.riskLevel === 'high' && (
                        <span className="text-orange-500" title={t('highRisk')}>🟠</span>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{locale === 'ar' ? translateSubject(assignment.subject) : assignment.subject}</td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{localizeDigits ? localizeDigits(formatDate(assignment.dueDate)) : formatDate(assignment.dueDate)}</td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    <span className={`chip ${statusClass(assignment.status)}`}>
                      {getStatusLabel(assignment.status)}
                    </span>
                  </td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {prediction ? (
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            prediction.riskLevel === 'critical' ? 'danger' :
                            prediction.riskLevel === 'high' ? 'warning' :
                            prediction.riskLevel === 'medium' ? 'warning' :
                            'success'
                          }
                          size="sm"
                        >
                          {prediction.riskLevel === 'critical' ? `🔴 ${t('critical')}` :
                           prediction.riskLevel === 'high' ? `🟠 ${t('high')}` :
                           prediction.riskLevel === 'medium' ? `🟡 ${t('medium')}` :
                           `🟢 ${t('low')}`}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {prediction.probability}% {t('onTime')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className={`py-3 px-3 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="flex gap-2">
                      <button className="hover:text-brand-500 transition-colors" aria-label="Edit">✏️</button>
                      <button className="hover:text-rose-500 transition-colors" aria-label="Delete">🗑️</button>
                      <button className="hover:text-slate-500 transition-colors" aria-label="Attach">📎</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function MessagesPanel({ t, locale, selectedStudentId }) {
  const { messages, unreadCount, loading, error } = useMessages(selectedStudentId)

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-3" padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{t('messages')}</h3>
          <span className="chip">—</span>
        </div>
        <ListSkeleton items={5} />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="col-span-12 md:col-span-3" padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{t('messages')}</h3>
          <span className="chip">—</span>
        </div>
        <div className="text-sm text-rose-600">{t('error')}: {error}</div>
      </Card>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <Card className="col-span-12 md:col-span-3" padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{t('messages')}</h3>
          <span className="chip">0</span>
        </div>
        <EmptyState
          icon="💬"
          title={t('noMessages')}
          message={t('noMessagesMessage')}
        />
      </Card>
    )
  }

  return (
    <Card className="col-span-12 md:col-span-3" padding="md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{t('messages')}</h3>
        {unreadCount > 0 && (
          <span className="chip bg-brand-500 text-white font-semibold">{unreadCount}</span>
        )}
      </div>
      <ul className="grid gap-3">
        {messages.slice(0, 5).map((message) => (
          <li key={message._id} className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer">
            <div className={`h-2.5 w-2.5 rounded-full ${message.read ? 'bg-slate-300' : 'bg-emerald-400'}`}></div>
            <div className="text-sm flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <b className="font-medium truncate">{message.from.name}</b>
                {!message.read && (
                  <span className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0"></span>
                )}
              </div>
              <div className="text-xs text-slate-500 truncate">{message.subject}</div>
            </div>
          </li>
        ))}
      </ul>
      {messages.length > 5 && (
        <div className="mt-3 text-xs text-slate-500 text-center">
          +{messages.length - 5} {t('moreMessages')}
        </div>
      )}
    </Card>
  )
}

// Recent Notices Preview - Simple list without Card wrapper
function RecentNoticesPreview({ selectedStudentId, t, locale, onViewAll }) {
  const { notices, loading } = useNotices(selectedStudentId)
  
  if (loading) {
    return (
      <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">{t?.('recentNotices') || 'Recent Notices'}</h4>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const recentNotices = notices?.slice(0, 3) || []

  return (
    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{t?.('recentNotices') || 'Recent Notices'}</h4>
      {recentNotices.length === 0 ? (
        <p className="text-sm text-slate-500">{t?.('noRecentNotices') || 'No recent notices'}</p>
      ) : (
        <div className="space-y-2">
          {recentNotices.map((notice) => (
            <div key={notice._id} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className={`font-medium text-slate-900 truncate ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{notice.title}</div>
              <div className={`text-xs text-slate-500 mt-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { calendar: 'gregory' }) : (t?.('recent') || (locale === 'ar' ? 'حديث' : 'Recent'))}
              </div>
            </div>
          ))}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2"
            >
              {t?.('viewAllNotices') || 'View All Notices'} {locale === 'ar' ? '←' : '→'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Recent Messages Preview - Simple list without Card wrapper
function RecentMessagesPreview({ selectedStudentId, t, locale, onViewAll }) {
  const { messages, loading } = useMessages(selectedStudentId)
  
  if (loading) {
    return (
      <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">{t?.('recentMessages') || 'Recent Messages'}</h4>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const recentMessages = messages?.slice(0, 2) || []

  return (
    <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{t?.('recentMessages') || 'Recent Messages'}</h4>
      {recentMessages.length === 0 ? (
        <p className="text-sm text-slate-500">{t?.('noRecentMessages') || 'No recent messages'}</p>
      ) : (
        <div className="space-y-2">
          {recentMessages.map((message) => (
            <div key={message._id} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className={`font-medium text-slate-900 truncate ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{message.subject || t?.('noSubject') || (locale === 'ar' ? 'بدون موضوع' : 'No Subject')}</div>
              <div className={`text-xs text-slate-500 mt-1 truncate ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                {message.from?.name || t?.('unknown') || (locale === 'ar' ? 'غير معروف' : 'Unknown')} • {message.createdAt ? new Date(message.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { calendar: 'gregory' }) : (t?.('recent') || (locale === 'ar' ? 'حديث' : 'Recent'))}
              </div>
            </div>
          ))}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2"
            >
              {t?.('viewAllMessages') || 'View All Messages'} {locale === 'ar' ? '←' : '→'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DashboardView({ t, locale, localizeDigits, selectedStudentId: propSelectedStudentId, onStudentChange }) {
  const { user } = useAuth()
  const { students, loading: studentsLoading, error: studentsError, refresh: refreshStudents } = useStudents(user?._id)
  const [selectedStudentId, setSelectedStudentId] = React.useState(propSelectedStudentId)
  const [activeTab, setActiveTab] = React.useState('overview')
  
  // Sync with prop changes
  React.useEffect(() => {
    if (propSelectedStudentId) {
      setSelectedStudentId(propSelectedStudentId)
    }
  }, [propSelectedStudentId])
  
  // Update parent when selection changes
  const handleStudentChange = (studentId) => {
    setSelectedStudentId(studentId)
    if (onStudentChange) {
      onStudentChange(studentId)
      localStorage.setItem('selectedStudentId', studentId)
    }
  }
  
  // Listen for refresh events from AdminDemo
  React.useEffect(() => {
    const handleRefresh = () => {
      refreshStudents()
    }
    
    window.addEventListener('refresh-dashboard', handleRefresh)
    return () => window.removeEventListener('refresh-dashboard', handleRefresh)
  }, [refreshStudents])

  // Ensure selected student is valid when students are loaded
  React.useEffect(() => {
    if (students && students.length > 0) {
      if (!selectedStudentId) {
        // If no student selected, redirect to selection (shouldn't happen, but safety check)
        handleStudentChange(students[0]._id)
      } else {
        // Verify selected student still exists
        const studentExists = students.some(s => s._id === selectedStudentId)
        if (!studentExists) {
          handleStudentChange(students[0]._id)
        }
      }
    }
  }, [students])

  // Reset selected student if current selection is invalid
  React.useEffect(() => {
    if (students && students.length > 0 && selectedStudentId) {
      const studentExists = students.some(s => s._id === selectedStudentId)
      if (!studentExists) {
        setSelectedStudentId(students[0]._id)
      }
    }
  }, [students, selectedStudentId])

  const selectedStudent = students?.find(s => s._id === selectedStudentId) || students?.[0]
  
  // Real-time updates for selected student
  const { lastUpdate } = useRealtime(selectedStudent?._id, user?.role === 'parent' || user?.role === 'admin' ? user._id : undefined)
  
  // Get assignments for student's courses - only fetch when student is selected
  const { assignments: studentAssignments, loading: assignmentsLoading, error: assignmentsError, refresh: refreshAssignments } = useAssignments(selectedStudent?._id || undefined)
  
  // Get assignment completion predictions
  const { predictions: assignmentPredictions } = useAllAssignmentCompletions(selectedStudent?._id || undefined)
  
  // Get grades for selected student - only fetch when student is selected
  const { grades, average: gradesAverage, loading: gradesLoading, refresh: refreshGrades } = useGrades(selectedStudent?._id || undefined)
  
  // Get courses for selected student - only fetch when student is selected
  const { courses, loading: coursesLoading, refresh: refreshCourses } = useCourses(selectedStudent?._id || undefined)
  
  // Get attendance stats for QuickStatsBar
  const { stats: attendanceStats } = useAttendance(selectedStudent?._id || undefined)
  
  // Get messages for unread count
  const { unreadCount } = useMessages(selectedStudentId)
  
  // Calculate pending assignments count
  const pendingAssignmentsCount = React.useMemo(() => {
    if (!studentAssignments) return 0
    return studentAssignments.filter(
      (a) => a.status === 'active' && (!a.dueDate || new Date(a.dueDate) >= new Date())
    ).length
  }, [studentAssignments])
  
  // Refresh data on real-time updates
  React.useEffect(() => {
    if (lastUpdate) {
      // Refresh relevant data based on update type
      if (lastUpdate.type === 'grade' || lastUpdate.type === 'assignment') {
        refreshGrades()
        refreshAssignments()
        refreshCourses()
      }
    }
  }, [lastUpdate, refreshGrades, refreshAssignments, refreshCourses])
  
  // Refresh all data when refresh event is triggered
  React.useEffect(() => {
    const handleRefresh = () => {
      if (selectedStudent?._id) {
        refreshAssignments()
        refreshGrades()
        refreshCourses()
      }
    }
    
    window.addEventListener('refresh-dashboard', handleRefresh)
    return () => window.removeEventListener('refresh-dashboard', handleRefresh)
  }, [selectedStudent?._id, refreshAssignments, refreshGrades, refreshCourses])

  const isLoading = studentsLoading || (selectedStudent && (assignmentsLoading || gradesLoading || coursesLoading))
  
  // Debug: Log state
  React.useEffect(() => {
    console.log('DashboardView Debug:', {
      user: user?._id,
      studentsCount: students?.length,
      selectedStudent: selectedStudent?._id,
      isLoading,
      studentsError
    })
  }, [user, students, selectedStudent, isLoading, studentsError])

  if (studentsLoading) {
    return (
      <section className="grid grid-cols-12 gap-3 p-3">
        <DashboardSkeleton />
      </section>
    )
  }

  // Show error state if there's an error
  if (studentsError) {
    return (
      <section className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 card">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Students</h3>
            <p className="text-sm text-slate-500">{studentsError}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!selectedStudent && students && students.length === 0) {
    return (
      <section className="grid grid-cols-12 gap-3 p-3">
        <div className="col-span-12 card">
          <EmptyState
            icon="👤"
            title={t('noStudents') || 'No Student Records'}
            message={t('noStudentsMessage') || 'No student records found for your account. Please contact your administrator to link a student to your account.'}
          />
        </div>
      </section>
    )
  }

  // Navigation handler
  const handleNavigate = (route) => {
    window.location.hash = route
  }

  return (
    <section className={`grid grid-cols-12 gap-6 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 min-h-screen ${locale === 'ar' ? 'rtl' : 'ltr'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Bar: Student Selector + Quick Stats */}
      <div className={`col-span-12 flex flex-col md:flex-row md:items-center gap-4 mb-2 ${locale === 'ar' ? 'md:flex-row-reverse' : 'md:justify-between'}`}>
        {/* Student Selector - Compact, top-right */}
        {students && students.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span>👤</span>
              {t('selectStudent') || 'Select Student'}:
            </label>
            <select
              className="h-9 rounded-lg bg-white shadow-soft px-3 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
              value={selectedStudentId || ''}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              {students.map(s => (
                <option key={s._id} value={s._id}>{getStudentDisplayName(s, locale)}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Quick Stats Bar */}
        <QuickStatsBar
          averageGrade={gradesAverage ? Math.round(gradesAverage) : null}
          attendanceRate={attendanceStats?.rate ? `${attendanceStats.rate}%` : '—'}
          pendingAssignments={pendingAssignmentsCount}
          unreadMessages={unreadCount || 0}
          localizeDigits={localizeDigits}
          onViewGradebook={() => handleNavigate('#/gradebook')}
          onViewAssignments={() => handleNavigate('#/progress')}
          onViewMessages={() => handleNavigate('#/messages')}
          t={t}
        />
      </div>

      {/* Hero Section: Welcome + Quick Actions */}
      <div className="col-span-12 grid grid-cols-12 gap-6 mb-6">
        <WelcomeCard 
          t={t} 
          localizeDigits={localizeDigits} 
          parentName={user?.name}
          onViewProgress={() => handleNavigate('#/progress')}
          locale={locale}
        />
        <QuickActionsPanel 
          onNavigate={handleNavigate}
          t={t}
        />
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        t={t}
      />

      {/* Tab Content */}
      <div className="col-span-12">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Today's Focus Section */}
            <UpcomingAssignments
              assignments={studentAssignments}
              loading={assignmentsLoading || coursesLoading}
              maxItems={5}
              t={t}
              locale={locale}
              onViewAll={() => setActiveTab('academics')}
            />
            <TodaySchedule
              studentId={selectedStudent?._id}
              t={t}
              locale={locale}
              onViewFull={() => handleNavigate('#/timetable')}
            />

            {/* Recent Activity - Collapsible */}
            <CollapsibleSection
              title={t('recentActivity') || 'Recent Activity'}
              icon="📋"
              defaultCollapsed={true}
              locale={locale}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Grades Preview */}
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('recentGrades') || 'Recent Grades'}</h4>
                  {grades && grades.length > 0 ? (
                    <div className="space-y-2">
                      {grades.slice(0, 3).map((grade) => {
                        const course = courses?.find(c => c._id === grade.courseId)
                        return (
                          <div key={grade._id} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className={`font-medium text-slate-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{course?.subject || (locale === 'ar' ? 'غير متوفر' : 'N/A')}</div>
                            <div className={`text-slate-600 mt-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{grade.percentage || 0}%</div>
                          </div>
                        )
                      })}
                      <button
                        onClick={() => handleNavigate('#/gradebook')}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2"
                      >
                        {t('viewAllGrades') || 'View All Grades'} {locale === 'ar' ? '←' : '→'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">{t('noRecentGrades') || 'No recent grades'}</p>
                  )}
                </div>

                {/* Recent Notices Preview */}
                <RecentNoticesPreview 
                  selectedStudentId={selectedStudentId} 
                  t={t} 
                  locale={locale}
                  onViewAll={() => handleNavigate('#/notifications')}
                />

                {/* Recent Messages Preview */}
                <RecentMessagesPreview 
                  selectedStudentId={selectedStudentId} 
                  t={t} 
                  locale={locale}
                  onViewAll={() => handleNavigate('#/messages')}
                />
              </div>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'academics' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Performance Overview */}
            <GradesCard 
              t={t} 
              locale={locale} 
              grades={grades}
              courses={courses}
              loading={gradesLoading || coursesLoading}
            />
            <LineChartCard t={t} />

            {/* Assignments Table */}
            <div className="col-span-12">
              <AssignmentsTable 
                t={t} 
                locale={locale} 
                localizeDigits={localizeDigits}
                assignments={studentAssignments}
                loading={assignmentsLoading || coursesLoading}
                error={assignmentsError}
                selectedStudentId={selectedStudent?._id}
                predictions={assignmentPredictions}
              />
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Communications */}
            <MessagesPanel t={t} locale={locale} selectedStudentId={selectedStudentId} />
            <NoticeBoard t={t} locale={locale} selectedStudentId={selectedStudentId} />

            {/* Resources & Tools - Collapsible */}
            <CollapsibleSection
              title={t('resourcesTools') || 'Resources & Tools'}
              icon="📚"
              defaultCollapsed={true}
              locale={locale}
            >
              <ResourcesCard t={t} />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </section>
  )
}

export default function App() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [locale, setLocale] = useState(() => {
    // Load locale from localStorage, default to 'en'
    return localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
  })
  
  // Save locale to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('language', locale)
    localStorage.setItem('locale', locale)
  }, [locale])
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash
    // Don't set hash automatically - let it be empty initially
    // It will be set when authenticated and student is selected
    return hash || ''
  })
  // Store selected student ID in localStorage for persistence
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    return localStorage.getItem('selectedStudentId')
  })
  const t = createT(locale)
  const { user, token } = useAuth()
  
  // Load students to validate selectedStudentId
  const { students: allStudents, loading: studentsLoading } = useStudents(user?._id)
  
  // Validate selectedStudentId exists in students list
  React.useEffect(() => {
    if (!studentsLoading && allStudents && allStudents.length > 0) {
      if (selectedStudentId) {
        const studentExists = allStudents.some(s => s._id === selectedStudentId)
        if (!studentExists) {
          // Invalid student ID, clear it
          console.log('Invalid selectedStudentId, clearing:', selectedStudentId)
          localStorage.removeItem('selectedStudentId')
          setSelectedStudentId(null)
        }
      }
    } else if (!studentsLoading && (!allStudents || allStudents.length === 0)) {
      // No students found, clear selection
      if (selectedStudentId) {
        localStorage.removeItem('selectedStudentId')
        setSelectedStudentId(null)
      }
    }
  }, [studentsLoading, allStudents, selectedStudentId])

  // Initialize real-time Socket.io connection
  React.useEffect(() => {
    if (token && user) {
      // Connect to Socket.io
      realtimeService.connect(token)
      
      // Join parent room if user is a parent/admin
      if ((user.role === 'parent' || user.role === 'admin') && user._id) {
        realtimeService.joinParentRoom(user._id)
      }
    }

    return () => {
      // Disconnect on unmount
      realtimeService.disconnect()
    }
  }, [token, user])

  // Calculate derived values (must be after all hooks)
  const isAdmin = user?.role === 'admin'
  const isAdminRoute = route?.startsWith('#/admin')

  // All hooks must be called before any conditional returns
  React.useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash || ''
      setRoute(hash)
    }
    
    // Initialize route from current hash
    onHash()
    
    // Set default route based on user role
    if (isAuthenticated && (!window.location.hash || window.location.hash === '')) {
      if (isAdmin) {
        // Admins go to admin dashboard
        window.location.hash = '#/admin'
        setRoute('#/admin')
      } else if (selectedStudentId) {
        // Parents go to regular dashboard if student is selected
        window.location.hash = '#/'
        setRoute('#/')
      }
    }
    
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [isAuthenticated, selectedStudentId, isAdmin])

  // If admin, redirect to admin dashboard and skip student selection
  React.useEffect(() => {
    if (isAdmin && isAuthenticated && (!window.location.hash || window.location.hash === '' || window.location.hash === '#')) {
      window.location.hash = '#/admin'
      setRoute('#/admin')
    }
  }, [isAdmin, isAuthenticated])

  // If non-admin tries to access admin routes, redirect to dashboard
  React.useEffect(() => {
    if (isAdminRoute && !isAdmin && isAuthenticated) {
      window.location.hash = '#/'
      setRoute('#/')
    }
  }, [isAdminRoute, isAdmin, isAuthenticated])

  const localizeDigits = (value) => {
    const s = String(value)
    if (locale !== 'ar') return s
    const map = '٠١٢٣٤٥٦٧٨٩'
    return s.replace(/[0-9]/g, (d) => map[d])
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-brand-500 grid place-items-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🎓</span>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login t={t} locale={locale} onLocaleChange={setLocale} />
  }

  // Show student selection if no student is selected (but skip for admins)
  // This should appear right after login for parents
  if (!selectedStudentId && !isAdmin) {
    console.log('App: No selectedStudentId, showing StudentSelection. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
    // Preserve the intended route so we can redirect back to it after student selection
    const intendedRoute = route || window.location.hash || '#/'
    return (
      <ErrorBoundary>
        <StudentSelection
          onSelect={(studentId) => {
            console.log('App: onSelect called with studentId:', studentId)
            if (studentId) {
              localStorage.setItem('selectedStudentId', studentId)
              setSelectedStudentId(studentId)
              // Redirect to the intended route (or dashboard if none specified)
              const targetRoute = intendedRoute || '#/'
              window.location.hash = targetRoute
              setRoute(targetRoute)
            }
          }}
          t={t}
          locale={locale}
        />
      </ErrorBoundary>
    )
  }
  
  console.log('App: Rendering dashboard. selectedStudentId:', selectedStudentId, 'route:', route)

  const navigate = (hash) => {
    window.location.hash = hash
    setRoute(hash)
    setMobileOpen(false)
  }

  // Clear selected student on logout
  const handleLogout = () => {
    // Disconnect from Socket.io
    realtimeService.disconnect()
    
    // Clear selected student
    localStorage.removeItem('selectedStudentId')
    setSelectedStudentId(null)
    
    // Logout (clears auth token and user) - this will make isAuthenticated false
    logout()
    
    // Clear route
    window.location.hash = ''
    setRoute('')
    
    // The component will re-render and show Login because isAuthenticated is now false
  }

  return (
    <GradeModeProvider>
      <UserAdaptiveProvider>
      <ErrorBoundary>
        <ProtectedRoute>
        <div className="min-h-screen md:h-full md:grid md:grid-cols-[16rem_1fr]" dir={locale==='ar' ? 'rtl' : 'ltr'}>
          {isAdmin && isAdminRoute ? (
            <>
              <div className="hidden md:flex">
                <AdminSidebar t={t} onNavigate={navigate} current={route} onLogout={handleLogout} />
              </div>
              {/* Mobile drawer for admin */}
              {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                  <div className="relative h-full w-72">
                    <AdminSidebar t={t} onNavigate={navigate} current={route} onLogout={handleLogout} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="hidden md:flex">
                <Sidebar t={t} onNavigate={navigate} current={route} onLogout={handleLogout} onSwitchStudent={() => {
                  localStorage.removeItem('selectedStudentId')
                  setSelectedStudentId(null)
                }} />
              </div>
              {/* Mobile drawer for parent */}
              {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                  <div className="relative h-full w-72">
                    <Sidebar t={t} onNavigate={navigate} current={route} onLogout={handleLogout} onSwitchStudent={() => {
                      localStorage.removeItem('selectedStudentId')
                      setSelectedStudentId(null)
                    }} />
                  </div>
                </div>
              )}
            </>
          )}
      <div className="flex flex-col md:pr-3">
        <Topbar 
          t={t} 
          locale={locale} 
          onToggleLocale={() => setLocale(locale==='en'?'ar':'en')} 
          onMenuClick={() => setMobileOpen(true)}
          currentRoute={route}
          onNavigate={navigate}
          user={user}
          onLogout={handleLogout}
          selectedStudentId={selectedStudentId}
        />
        <PageTransition>
          {route === '#/children' ? (
            <ChildrenManagement 
              selectedStudentId={selectedStudentId} 
              onStudentSelect={(studentId) => {
                setSelectedStudentId(studentId)
                localStorage.setItem('selectedStudentId', studentId)
                // Redirect to dashboard when student is selected
                window.location.hash = '#/'
                setRoute('#/')
              }} 
              t={t} 
            />
          ) : route === '#/progress' ? (
            <div className="p-3"><AcademicProgress t={t} locale={locale} localizeDigits={localizeDigits} selectedStudentId={selectedStudentId} /></div>
          ) : route === '#/gradebook' ? (
            <DetailedGradebook selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/insights' ? (
            <LearningInsights selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/attendance' ? (
            <AttendanceBehavior selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/timetable' ? (
            <TimetablePage selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/fees' ? (
            <FeesPage selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/notifications' ? (
            <NotificationsCenter selectedStudentId={selectedStudentId} t={t} />
          ) : route === '#/calendar' ? (
            <CalendarPage selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/messages' ? (
            <MessagingPage selectedStudentId={selectedStudentId} t={t} locale={locale} />
          ) : route === '#/settings' ? (
            <SettingsPage t={t} locale={locale} onLocaleChange={setLocale} />
          ) : isAdminRoute ? (
            // Admin routes - only accessible to admins
            isAdmin ? (
              <AdminDemo route={route} />
            ) : (
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                <p className="text-slate-600">You need admin privileges to access this page.</p>
              </div>
            )
          ) : (
            <DashboardView 
              t={t} 
              locale={locale} 
              localizeDigits={localizeDigits} 
              selectedStudentId={selectedStudentId} 
              onStudentChange={(studentId) => {
                setSelectedStudentId(studentId)
                localStorage.setItem('selectedStudentId', studentId)
                // If not already on dashboard, redirect to dashboard
                const currentRoute = window.location.hash || route || ''
                if (currentRoute !== '#/' && currentRoute !== '') {
                  window.location.hash = '#/'
                  setRoute('#/')
                }
              }} 
            />
          )}
        </PageTransition>
      </div>
    </div>
      </ProtectedRoute>
    </ErrorBoundary>
      </UserAdaptiveProvider>
    </GradeModeProvider>
  )
}


