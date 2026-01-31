import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'
import { getRegistrationStatus, register as registerApi } from './auth.api'
import { toast } from '../stores/toast.store'

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationCheck, setRegistrationCheck] = useState<'checking' | 'allowed'>('checking')
  const redirectHandledRef = useRef(false)
  const navigate = useNavigate()
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  useEffect(() => {
    getRegistrationStatus()
      .then((data) => {
        if (!data.registration_allowed) {
          if (redirectHandledRef.current) return
          redirectHandledRef.current = true
          toast.error('Registration is currently disabled. Please contact an administrator to create an account.')
          navigate('/loginUp', { replace: true })
        } else {
          setRegistrationCheck('allowed')
        }
      })
      .catch(() => {
        if (redirectHandledRef.current) return
        redirectHandledRef.current = true
        toast.error('Unable to check registration status. Please try again later.')
        navigate('/loginUp', { replace: true })
      })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      const msg = 'Passwords do not match'
      setError(msg)
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      await registerApi({
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      })
      toast.success('User has been successfully created.')
      navigate('/loginUp')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className={`min-h-screen h-screen max-h-screen flex overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Left Side - Brand Panel (Hidden on mobile) */}
      <div className={`hidden lg:flex lg:w-1/2 lg:min-h-0 items-center justify-center p-8 lg:p-10 overflow-y-auto ${isDarkMode
          ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDarkMode
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                : 'bg-gradient-to-br from-amber-400 to-yellow-500'
              } shadow-xl`}>
              <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className={`text-4xl font-bold tracking-tight ${isDarkMode
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent'
              }`}>
              GoldFlow
            </span>
          </div>

          {/* Tagline */}
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
            Join Our Platform
          </h2>
          <p className={`text-lg mb-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Start managing your manufacturing operations with powerful tools.
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Real-time Analytics Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quality Control Management</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Automated Workflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className={`w-full lg:w-1/2 min-h-0 flex flex-col items-center justify-start py-6 px-4 sm:px-6 lg:px-8 overflow-y-auto ${isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}>
        <div className="w-full max-w-md flex-shrink-0">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-4">
            {/* Logo Icon */}
            {/* <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600' 
                : 'bg-gradient-to-br from-amber-400 to-yellow-500'
            } shadow-lg`}>
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div> */}
            {/* Brand Name */}
            {/* <span className={`text-2xl font-bold tracking-tight ${
              isDarkMode 
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent'
            }`}>
              GoldFlow
            </span> */}
          </div>

          {/* Registration status check: show form only when allowed */}
          {registrationCheck === 'checking' && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div
                className={`signup-checking-spinner w-10 h-10 rounded-full border-2 border-t-transparent ${
                  isDarkMode ? 'border-slate-500 border-t-amber-400' : 'border-gray-300 border-t-amber-500'
                }`}
                aria-hidden
              />
              <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Checking if registration is available…
              </p>
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Please wait
              </p>
            </div>
          )}

          {registrationCheck === 'allowed' && (
            <div className="signup-form-enter">
              {/* Welcome Header */}
              <div className="mb-5">
                <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  Create Account
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Join GoldFlow and start your journey
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    required
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    required
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    required
                  />
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g. +1 234 567 8900"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign Up Button */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                  <Link
                    to="/loginUp"
                    className={`flex-1 py-3 px-6 rounded-full font-semibold text-center border-2 transition-all duration-200 ${isDarkMode
                        ? 'border-slate-600 text-gray-300 hover:bg-slate-800 hover:border-slate-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                  >
                    Sign In
                  </Link>
                </div>
              </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link
                to="/loginUp"
                className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
