'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  CreditCard,
  Activity,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface User {
  id: number
  email: string
}

interface Transaction {
  id: number
  merchantName: string
  merchantCode: string
  merchantDescription: string
  amount: number
  status: string
  timestamp: string
  isMedical: boolean
  cardNumber: string
}

interface TransactionStats {
  totalTransactions: number
  totalSpent: number
  medicalSpent: number
  nonMedicalSpent: number
  declinedCount: number
  successRate: string
}

interface BalanceHistoryPoint {
  date: string
  balance: number
  type: string
}

interface Account {
  id: number
  balance: number
}

export default function TransactionsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [chartTimeframe, setChartTimeframe] = useState<number>(30)
  const router = useRouter()

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAccount()
      fetchTransactions()
      fetchStats()
    }
  }, [user, currentPage])

  useEffect(() => {
    if (account) {
      fetchBalanceHistory()
    }
  }, [account, chartTimeframe])

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

  const fetchAccount = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch('/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAccount(data.account)
      }
    } catch (error) {
      console.error('Account fetch error:', error)
    }
  }

  const fetchBalanceHistory = async () => {
    if (!account) return

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch(`/api/accounts/${account.id}/balance-history?days=${chartTimeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBalanceHistory(data.balanceHistory)
      }
    } catch (error) {
      console.error('Balance history fetch error:', error)
    }
  }

  const fetchTransactions = async () => {
    if (!user) return

    try {
      setIsLoadingMore(true)
      const token = localStorage.getItem('hsa_token')
      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      
      const response = await fetch(`/api/transactions?limit=${ITEMS_PER_PAGE}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (currentPage === 1) {
          setTransactions(data.transactions)
        } else {
          setTransactions(prev => [...prev, ...data.transactions])
        }
        setHasMore(data.transactions.length === ITEMS_PER_PAGE)
      } else {
        toast.error('Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Transactions fetch error:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setIsLoadingMore(false)
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch('/api/transactions/stats/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.summary)
      }
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.merchantCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCurrentPage(1)
    setTransactions([])
    fetchTransactions()
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // For chart labels, show more specific date information
    if (chartTimeframe <= 7) {
      // For 7 days or less, show day names
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (chartTimeframe <= 30) {
      // For 30 days, show month and day
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (chartTimeframe <= 90) {
      // For 90 days, show month and day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      // For 1 year, show month and year
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'declined':
        return <XCircle className="w-4 h-4 text-error-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-warning-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-success-600 bg-success-50 border-success-200'
      case 'declined':
        return 'text-error-600 bg-error-50 border-error-200'
      default:
        return 'text-warning-600 bg-warning-50 border-warning-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction history...</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-warning-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-lg text-gray-600">View all your HSA spending activity</p>
        </div>

                 {/* Balance Chart */}
         {account && (
           <div className="card mb-8">
             <div className="card-header">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                     <TrendingUp className="w-6 h-6 text-primary-600" />
                   </div>
                   <div>
                     <h2 className="card-title">Account Balance Over Time</h2>
                     <p className="card-subtitle">
                       Current Balance: {account ? formatCurrency(account.balance) : '$0.00'}
                     </p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={() => setChartTimeframe(7)}
                     className={`btn-secondary-sm ${chartTimeframe === 7 ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}`}
                   >
                     7 Days
                   </button>
                   <button
                     onClick={() => setChartTimeframe(30)}
                     className={`btn-secondary-sm ${chartTimeframe === 30 ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}`}
                   >
                     30 Days
                   </button>
                   <button
                     onClick={() => setChartTimeframe(90)}
                     className={`btn-secondary-sm ${chartTimeframe === 90 ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}`}
                   >
                     90 Days
                   </button>
                   <button
                     onClick={() => setChartTimeframe(365)}
                     className={`btn-secondary-sm ${chartTimeframe === 365 ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}`}
                   >
                     1 Year
                   </button>
                 </div>
               </div>
             </div>
             <div className="p-6">
               {balanceHistory.length === 0 ? (
                 <div className="text-center py-12">
                   <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-600 text-lg">Loading balance history...</p>
                 </div>
               ) : (
                 <div className="h-80">
                   <Line
                   data={{
                     labels: balanceHistory.map(point => formatChartDate(point.date)),
                     datasets: [
                       {
                         label: 'Account Balance',
                         data: balanceHistory.map(point => point.balance),
                         borderColor: '#4F46E5', // Primary color
                         backgroundColor: 'rgba(79, 70, 229, 0.1)',
                         fill: true,
                         tension: 0.4,
                         pointRadius: 3,
                         pointHoverRadius: 6,
                         pointBackgroundColor: '#4F46E5',
                         pointBorderColor: '#ffffff',
                         pointBorderWidth: 2
                       }
                     ]
                   }}
                   options={{
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                       legend: {
                         display: false
                       },
                       tooltip: {
                         backgroundColor: 'rgba(0, 0, 0, 0.8)',
                         titleColor: '#ffffff',
                         bodyColor: '#ffffff',
                         borderColor: '#4F46E5',
                         borderWidth: 1,
                         callbacks: {
                           label: function(context) {
                             let label = context.dataset.label || '';
                             if (label) {
                               label += ': ';
                             }
                             if (context.parsed.y !== null) {
                               label += formatCurrency(context.parsed.y);
                             }
                             return label;
                           }
                         }
                       }
                     },
                     scales: {
                       x: {
                         ticks: {
                           color: '#6B7280',
                           maxRotation: 45,
                           minRotation: 0,
                           autoSkip: true,
                           maxTicksLimit: chartTimeframe <= 7 ? 7 : chartTimeframe <= 30 ? 10 : chartTimeframe <= 90 ? 12 : 15
                         },
                         grid: {
                           color: '#E5E7EB'
                         }
                       },
                       y: {
                         ticks: {
                           color: '#6B7280',
                           callback: function(value) {
                             return formatCurrency(value as number);
                           }
                         },
                         grid: {
                           color: '#E5E7EB'
                         }
                       }
                     },
                     interaction: {
                       intersect: false,
                       mode: 'index'
                     },
                     elements: {
                       point: {
                         hoverBackgroundColor: '#4F46E5',
                         hoverBorderColor: '#ffffff'
                       }
                     }
                   }}
                   />
                 </div>
               )}
             </div>
           </div>
         )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-error-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Declined</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.declinedCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by merchant name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>

              <button
                onClick={resetFilters}
                className="btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Transactions</h2>
            <p className="card-subtitle">
              {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No transactions found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters' 
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Medical/Non-Medical Indicator */}
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.isMedical ? 'bg-success-500' : 'bg-error-500'
                      }`} title={transaction.isMedical ? 'Medical Expense' : 'Non-Medical Expense'}></div>
                      
                      {/* Transaction Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{transaction.merchantName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <CreditCard className="w-4 h-4" />
                            <span>Card: {transaction.cardNumber.slice(-4)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(transaction.timestamp)}</span>
                          </span>
                          {transaction.merchantDescription && (
                            <span className="text-gray-500">
                              {transaction.merchantDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status Icon */}
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && filteredTransactions.length === transactions.length && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="btn-secondary disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load More Transactions'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
