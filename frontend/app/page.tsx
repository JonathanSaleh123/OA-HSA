'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CreditCard, Shield, TrendingUp, Heart } from 'lucide-react'
import toast from 'react-hot-toast'


interface AuthForm {
  email: string
  password: string
}

interface AuthResponse {
  message: string
  user: {
    id: number
    email: string
  }
  token: string
}

interface AuthError {
  error: string
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState<AuthForm>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('hsa_token')
      const user = localStorage.getItem('hsa_user')
      
      console.log('🔍 Checking authentication...', { hasToken: !!token, hasUser: !!user })
      
      if (token && user) {
        try {
          console.log('🔑 Validating token...')
          // Validate the token by making a test request to accounts endpoint
          const response = await fetch('/api/accounts', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          console.log('📡 Token validation response:', response.status)
          
          if (response.ok) {
            // Token is valid, redirect to dashboard
            console.log('✅ Token valid, redirecting to dashboard')
            router.push('/dashboard')
          } else {
            // Token is invalid, clear it and show login form
            console.log('❌ Token invalid, clearing and showing login form')
            localStorage.removeItem('hsa_token')
            localStorage.removeItem('hsa_user')
            setIsCheckingAuth(false)
          }
        } catch (error) {
          // Network error or other issue, clear tokens and show login form
          console.log('🚨 Token validation error:', error)
          localStorage.removeItem('hsa_token')
          localStorage.removeItem('hsa_user')
          setIsCheckingAuth(false)
        }
      } else {
        // No tokens found, show login form
        console.log('🔓 No tokens found, showing login form')
        setIsCheckingAuth(false)
      }
    }
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth check timeout, showing login form')
      setIsCheckingAuth(false)
    }, 5000) // 5 second timeout
    
    checkAuth()
    
    return () => clearTimeout(timeoutId)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if still checking auth
    if (isCheckingAuth) return
    
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data: AuthResponse = await response.json()
        
        // Store token in localStorage
        localStorage.setItem('hsa_token', data.token)
        localStorage.setItem('hsa_user', JSON.stringify(data.user))
        
        toast.success(data.message)
        router.push('/dashboard')
      } else {
        const errorData: AuthError = await response.json()
        toast.error(errorData.error || 'Authentication failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent input changes if still checking auth
    if (isCheckingAuth) return
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HSA Manager</h1>
            </div>
            <div className="text-sm text-gray-600">
              Health Savings Account Platform
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Manage Your Health Savings Account
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Take control of your healthcare finances with our comprehensive HSA platform. 
                Track expenses, issue virtual cards, and maximize your tax advantages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Virtual Debit Cards</h3>
                  <p className="text-sm text-gray-600">Issue and manage cards linked to your HSA</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Medical Validation</h3>
                  <p className="text-sm text-gray-600">Automatic IRS medical expense verification</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tax Advantages</h3>
                  <p className="text-sm text-gray-600">Maximize your healthcare savings benefits</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-error-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Health First</h3>
                  <p className="text-sm text-gray-600">Prioritize your healthcare financial planning</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Authentication Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Sign in to access your HSA account' 
                  : 'Start managing your healthcare savings today'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => !isCheckingAuth && setIsLogin(!isLogin)}
                disabled={isCheckingAuth}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>

            {!isLogin && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This is a demonstration application. 
                  No real financial transactions will occur.
                </p>
              </div>
            )}


          </div>
        </div>
      </main>
    </div>
  )
}
