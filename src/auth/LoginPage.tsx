import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const isDarkMode = useUIStore((state) => state.isDarkMode)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add your login logic here
    navigate('/index')
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Left Side - Brand Panel (Hidden on mobile) */}
      <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600' 
                : 'bg-gradient-to-br from-amber-400 to-yellow-500'
            } shadow-xl`}>
              <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={`text-4xl font-bold tracking-tight ${
              isDarkMode 
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent'
            }`}>
              GoldFlow
            </span>
          </div>

          {/* Tagline */}
          <h2 className={`text-2xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Streamline Your Business
          </h2>
          <p className={`text-lg mb-10 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Powerful tools to manage your manufacturing operations efficiently.
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Real-time Analytics Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quality Control Management</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
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

      {/* Right Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 ${
        isDarkMode ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-8">
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

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Back!
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to continue to GoldFlow
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`w-4 h-4 rounded border transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500/20'
                      : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/20'
                  }`}
                />
                <span className={`ml-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Remember Me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                Forget Password?
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Sign In
              </button>
              <Link
                to="/signUp"
                className={`flex-1 py-3 px-6 rounded-full font-semibold text-center border-2 transition-all duration-200 ${
                  isDarkMode
                    ? 'border-slate-600 text-gray-300 hover:bg-slate-800 hover:border-slate-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                Create Account
              </Link>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Dont have an Account ?{' '}
              <Link
                to="/signUp"
                className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
