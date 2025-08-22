'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  DollarSign, 
  Plus, 
  Heart,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
}

interface Account {
  id: number
  balance: number
  created: string
  updated: string
}

export default function DepositPage() {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && !account) {
      fetchAccountData()
    }
  }, [user, account])

  const checkAuth = () => {
    const token = localStorage.getItem('hsa_token')
    const userData = localStorage.getItem('hsa_user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      localStorage.removeItem('hsa_token')
      localStorage.removeItem('hsa_user')
      router.push('/')
    }
  }

  const fetchAccountData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAccount(data.account)
      } else {
        toast.error('Failed to fetch account information')
      }
    } catch (error) {
      console.error('Account fetch error:', error)
      toast.error('Failed to fetch account information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!account) {
      toast.error('Account information not available')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch(`/api/accounts/${account.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully deposited ${formatCurrency(parseFloat(amount))}`)
        
        // Update local account balance
        setAccount(prev => prev ? {
          ...prev,
          balance: data.account.newBalance
        } : null)
        
        // Reset form
        setAmount('')
        
        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Deposit failed')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      toast.error('Failed to process deposit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">HSA by Human Interest</h1>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email || 'User'}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-success-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit Funds</h1>
          <p className="text-lg text-gray-600">Add money to your Health Savings Account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Deposit Amount</h2>
                <p className="card-subtitle">Enter the amount you'd like to deposit</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                      className="input-field pl-10 text-lg"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum deposit: $0.01
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quick Amounts
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[25, 50, 100, 250, 500, 1000].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        disabled={isSubmitting}
                      >
                        ${quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                    className="w-full btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Deposit Funds</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            {/* Current Balance */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Current Balance</h3>
                <p className="card-subtitle">Your HSA funds</p>
              </div>
              <div className="text-3xl font-bold text-primary-600">
                {account ? formatCurrency(account.balance) : '$0.00'}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Account created: {account ? formatDate(account.created) : 'N/A'}
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
