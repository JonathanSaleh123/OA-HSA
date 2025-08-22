'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  LogOut, 
  Plus,
  Heart,
  ArrowRight
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

interface Card {
  id: number
  number: string
  expired: string
  created: string
  isActive: boolean
}

interface Transaction {
  id: number
  merchantName: string
  amount: number
  status: string
  timestamp: string
  isMedical: boolean
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataFetched, setIsDataFetched] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && !isDataFetched) {
      fetchDashboardData()
    }
  }, [user, isDataFetched])

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

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('hsa_token')
      
      // Fetch account data
      const accountResponse = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Account response status:', accountResponse.status)
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json()
        console.log('Account data:', accountData)
        setAccount(accountData.account)
        
        // Fetch recent transactions after we have the account
        const transactionsResponse = await fetch(`/api/accounts/${accountData.account.id}/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        console.log('Transactions response status:', transactionsResponse.status)
        
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          console.log('Transactions data:', transactionsData)
          setRecentTransactions(transactionsData.transactions.slice(0, 5))
          setTotalTransactions(transactionsData.transactions.length)
        } else {
          console.error('Transactions response not ok:', transactionsResponse.status, transactionsResponse.statusText)
        }
      } else {
        console.error('Account response not ok:', accountResponse.status, accountResponse.statusText)
        const errorText = await accountResponse.text()
        console.error('Error response:', errorText)
      }

      // Fetch cards
      const cardsResponse = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Cards response status:', cardsResponse.status)
      
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json()
        console.log('Cards data:', cardsData)
        setCards(cardsData.cards)
      } else {
        console.error('Cards response not ok:', cardsResponse.status, cardsResponse.statusText)
        const errorText = await cardsResponse.text()
        console.error('Cards error response:', errorText)
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
      setIsDataFetched(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hsa_token')
    localStorage.removeItem('hsa_user')
    toast.success('Logged out successfully')
    router.push('/')
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
          <p className="text-gray-600">Loading your HSA dashboard...</p>
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
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Account Info & Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Balance */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="card-title">Account Balance</h3>
                      <p className="card-subtitle">Current HSA funds</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary-600">
                  {account ? formatCurrency(account.balance) : '$0.00'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Account created: {account ? formatDate(account.created) : 'N/A'}
                </p>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-warning-600" />
                    </div>
                    <div>
                      <h3 className="card-title">Recent Activity</h3>
                      <p className="card-subtitle">Latest transactions</p>
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-warning-600">
                  {totalTransactions}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Transactions this month
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Transactions</h3>
                <p className="card-subtitle">Your latest HSA spending activity</p>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.isMedical ? 'bg-success-500' : 'bg-error-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.merchantName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className={`text-sm ${
                          transaction.status === 'approved' ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {recentTransactions.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push('/dashboard/transactions')}
                    className="btn-secondary"
                  >
                    View All Transactions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Quick Actions */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
                <p className="card-subtitle">Manage your HSA account</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/dashboard/deposit')}
                  className="w-full p-4 bg-success-50 hover:bg-success-100 rounded-lg border border-success-200 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-6 h-6 text-success-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Deposit Funds</h4>
                      <p className="text-sm text-gray-600">Add money to your HSA</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-success-600 transition-colors ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/cards')}
                  className="w-full p-4 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Manage Cards</h4>
                      <p className="text-sm text-gray-600">Issue or deactivate cards</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/transactions')}
                  className="w-full p-4 bg-warning-50 hover:bg-warning-100 rounded-lg border border-warning-200 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-warning-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">View Transactions</h4>
                      <p className="text-sm text-gray-600">See spending history</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-warning-600 transition-colors ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/test-transaction')}
                  className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Test Transactions</h4>
                      <p className="text-sm text-gray-600">Validate merchants & test</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors ml-auto" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
