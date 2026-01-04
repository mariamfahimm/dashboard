// Login Component - Enhanced with beautiful UI and animations
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PasswordChangeModal } from './PasswordChangeModal'

interface LoginProps {
  t?: (key: string) => string
  locale?: string
  onLocaleChange?: (locale: string) => void
}

export function Login({ t, locale = 'en', onLocaleChange }: LoginProps) {
  const getTranslation = (key: string, fallback: string) => t ? t(key) || fallback : fallback
  const isRTL = locale === 'ar'
  
  // Load locale from localStorage on mount
  React.useEffect(() => {
    const savedLocale = localStorage.getItem('language') || localStorage.getItem('locale') || 'en'
    if (onLocaleChange && savedLocale !== locale) {
      onLocaleChange(savedLocale)
    }
  }, [])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const { login } = useAuth()
  
  const handleLocaleChange = (newLocale: string) => {
    localStorage.setItem('language', newLocale)
    localStorage.setItem('locale', newLocale)
    if (onLocaleChange) {
      onLocaleChange(newLocale)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      // If password change is required, show modal
      if (result?.mustChangePassword) {
        setShowPasswordChangeModal(true)
      }
    } catch (err: any) {
      setError(err.message || getTranslation('loginFailed', 'Login failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-gradient">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20 animate-gradient-shift"></div>
      
      {/* Multiple animated blob layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Secondary smaller blobs */}
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob-slow animation-delay-1000"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-violet-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob-slow animation-delay-3000"></div>
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-rose-300 rounded-full mix-blend-multiply filter blur-2xl opacity-25 animate-blob-reverse animation-delay-5000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-float animation-delay-0"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-float animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/5 w-2 h-2 bg-indigo-400 rounded-full opacity-60 animate-float animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-float animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-violet-400 rounded-full opacity-60 animate-float animation-delay-5000"></div>
        
        {/* Larger floating elements */}
        <div className="absolute top-10 left-1/2 w-4 h-4 bg-blue-300 rounded-full opacity-40 animate-float-slow animation-delay-1500"></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-purple-300 rounded-full opacity-40 animate-float-slow animation-delay-3500"></div>
        <div className="absolute top-3/4 left-10 w-4 h-4 bg-pink-300 rounded-full opacity-40 animate-float-slow animation-delay-5500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl relative z-10 border border-white/20" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Language Selector */}
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-4`}>
          <div className="flex gap-2 bg-white/50 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => handleLocaleChange('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                locale === 'en'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLocaleChange('ar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                locale === 'ar'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Logo and Header */}
        <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="relative inline-block mb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 grid place-items-center mx-auto shadow-lg transform hover:scale-105 transition-transform duration-300">
              <span className="text-4xl">🎓</span>
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            {getTranslation('welcomeToEduConnect', 'Welcome to EduConnect')}
          </h2>
          <p className="text-slate-600 font-medium">{getTranslation('signInToAccess', 'Sign in to access your dashboard')}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded-lg text-sm animate-shake">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className={`block text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {getTranslation('emailAddress', 'Email Address')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === 'ar' ? 'example@example.com' : 'you@example.com'}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200 bg-white/50"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={`block text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {getTranslation('password', 'Password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={getTranslation('enterYourPassword', 'Enter your password')}
                className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all duration-200 bg-white/50"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-4 rounded-xl font-semibold hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {getTranslation('signingIn', 'Signing in...')}
              </span>
            ) : (
              getTranslation('signIn', 'Sign In')
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={`text-center text-sm text-slate-600 pt-4 border-t border-slate-200 ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="font-medium">{getTranslation('demoCredentials', 'Demo credentials:')}</p>
          <p className="mt-1 font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
            {getTranslation('checkDatabaseForEmails', 'Check your database for user emails')}
          </p>
        </div>
      </div>

      <style>{`
        /* Gradient animation */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        
        /* Primary blob animation - more dynamic */
        @keyframes blob {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(50px, -80px) scale(1.15) rotate(90deg);
          }
          50% {
            transform: translate(-40px, 60px) scale(0.95) rotate(180deg);
          }
          75% {
            transform: translate(30px, 40px) scale(1.1) rotate(270deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(360deg);
          }
        }
        .animate-blob {
          animation: blob 20s infinite ease-in-out;
        }
        
        /* Slower blob animation */
        @keyframes blob-slow {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-60px, 70px) scale(1.2) rotate(120deg);
          }
          66% {
            transform: translate(70px, -50px) scale(0.9) rotate(240deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(360deg);
          }
        }
        .animate-blob-slow {
          animation: blob-slow 25s infinite ease-in-out;
        }
        
        /* Reverse blob animation */
        @keyframes blob-reverse {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-50px, 80px) scale(1.15) rotate(-90deg);
          }
          50% {
            transform: translate(40px, -60px) scale(0.95) rotate(-180deg);
          }
          75% {
            transform: translate(-30px, -40px) scale(1.1) rotate(-270deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(-360deg);
          }
        }
        .animate-blob-reverse {
          animation: blob-reverse 22s infinite ease-in-out;
        }
        
        /* Floating particles */
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-30px) translateX(20px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-60px) translateX(-15px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(10px);
            opacity: 0.7;
          }
        }
        .animate-float {
          animation: float 8s infinite ease-in-out;
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translateY(-50px) translateX(30px) scale(1.2);
            opacity: 0.6;
          }
          66% {
            transform: translateY(-100px) translateX(-25px) scale(0.8);
            opacity: 0.3;
          }
        }
        .animate-float-slow {
          animation: float-slow 12s infinite ease-in-out;
        }
        
        /* Animation delays */
        .animation-delay-0 {
          animation-delay: 0s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-3500 {
          animation-delay: 3.5s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-5000 {
          animation-delay: 5s;
        }
        .animation-delay-5500 {
          animation-delay: 5.5s;
        }
        
        /* Shake animation for errors */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
      
      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
      />
    </div>
  )
}

