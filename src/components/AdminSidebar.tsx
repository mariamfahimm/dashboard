import React from 'react'
import {
  HiHome,
  HiUsers,
  HiBookOpen,
  HiCalendar,
  HiBell,
  HiChat,
  HiCog,
  HiLogout,
  HiAcademicCap,
  HiUserGroup,
  HiDocumentText,
  HiExclamationCircle,
  HiCurrencyDollar,
  HiChartBar,
  HiLightBulb,
  HiRefresh
} from 'react-icons/hi'

interface AdminSidebarProps {
  t: (key: string) => string
  onNavigate: (hash: string) => void
  current: string
  onLogout: () => void
}

export function AdminSidebar({ t, onNavigate, current, onLogout }: AdminSidebarProps) {
  // Admin-specific navigation organized by category
  const adminLinks = [
    // Dashboard
    { 
      label: 'Admin Dashboard', 
      hash: '#/admin', 
      icon: HiHome,
      category: 'main'
    },
    
    // Student Management
    { 
      label: 'Students & Grades', 
      hash: '#/admin/students', 
      icon: HiUsers,
      category: 'management'
    },
    { 
      label: 'Courses', 
      hash: '#/admin/courses', 
      icon: HiBookOpen,
      category: 'management'
    },
    
    // Parent Management
    { 
      label: 'Parent Accounts', 
      hash: '#/admin/parents', 
      icon: HiUserGroup,
      category: 'management'
    },
    
    // Content Management
    { 
      label: 'Assignments', 
      hash: '#/admin/assignments', 
      icon: HiDocumentText,
      category: 'content'
    },
    { 
      label: 'Alerts', 
      hash: '#/admin/alerts', 
      icon: HiExclamationCircle,
      category: 'content'
    },
    { 
      label: 'Messages', 
      hash: '#/admin/messages', 
      icon: HiChat,
      category: 'content'
    },
    { 
      label: 'Fees', 
      hash: '#/admin/fees', 
      icon: HiCurrencyDollar,
      category: 'content'
    },
    { 
      label: 'Events', 
      hash: '#/admin/events', 
      icon: HiCalendar,
      category: 'content'
    },
    
    // Analytics & Insights
    { 
      label: 'Analytics', 
      hash: '#/admin/analytics', 
      icon: HiChartBar,
      category: 'analytics'
    },
    { 
      label: 'Insights', 
      hash: '#/admin/insights', 
      icon: HiLightBulb,
      category: 'analytics'
    },
    
    // System
    { 
      label: 'Notifications', 
      hash: '#/admin/notifications', 
      icon: HiBell,
      category: 'system'
    },
    { 
      label: 'Settings', 
      hash: '#/admin/settings', 
      icon: HiCog,
      category: 'system'
    },
  ]

  const isActive = (hash: string) => {
    if (hash === '#/admin') {
      return current === '#/admin' || current === '#/admin/'
    }
    return current === hash
  }

  // Group links by category
  const groupedLinks = {
    main: adminLinks.filter(l => l.category === 'main'),
    management: adminLinks.filter(l => l.category === 'management'),
    content: adminLinks.filter(l => l.category === 'content'),
    analytics: adminLinks.filter(l => l.category === 'analytics'),
    system: adminLinks.filter(l => l.category === 'system'),
  }

  const categoryLabels = {
    main: '',
    management: 'Management',
    content: 'Content',
    analytics: 'Analytics',
    system: 'System'
  }

  return (
    <aside className="w-64 shrink-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-3xl m-3 p-4 flex flex-col shadow-xl">
      {/* Logo */}
      <a 
        href="#/admin" 
        onClick={(e)=>{ e.preventDefault(); onNavigate('#/admin') }}
        className="flex items-center gap-3 px-3 py-4 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer group"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 grid place-items-center shadow-lg group-hover:scale-105 transition-transform">
          <HiAcademicCap className="w-6 h-6 text-white" />
        </div>
        <div className="font-bold text-lg">Admin Panel</div>
      </a>

      {/* Navigation */}
      <nav className="mt-6 grid gap-1 flex-1 overflow-y-auto">
        {Object.entries(groupedLinks).map(([category, links]) => (
          <div key={category}>
            {categoryLabels[category] && links.length > 0 && (
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {categoryLabels[category]}
              </div>
            )}
            {links.map((link) => {
              const active = isActive(link.hash)
              const Icon = link.icon || HiHome
              
              return (
                <a
                  key={link.hash}
                  href={link.hash}
                  onClick={(e)=>{ 
                    e.preventDefault()
                    if(link.hash){ 
                      onNavigate(link.hash)
                    }
                  }}
                  className={`
                    px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer 
                    flex items-center gap-3 text-sm font-medium mb-1
                    ${active 
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }
                    group
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  <span className="flex-1">{link.label}</span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  )}
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-4 space-y-2 border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full bg-white/10 text-white rounded-xl py-2.5 text-sm hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
        >
          <HiLogout className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

