'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  CreditCard, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Heart,
  Calendar,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
}

interface Card {
  id: number
  number: string
  expired: string
  created: string
  isActive: boolean
}

export default function CardsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCardNumbers, setShowCardNumbers] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCards()
    }
  }, [user])

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

  const fetchCards = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCards(data.cards)
      } else {
        toast.error('Failed to fetch cards')
      }
    } catch (error) {
      console.error('Cards fetch error:', error)
      toast.error('Failed to fetch cards')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatCardNumber = (number: string) => {
    if (showCardNumbers) {
      return number.replace(/(\d{4})/g, '$1 ').trim()
    }
    return `**** **** **** ${number.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (expiredDate: string) => {
    return new Date(expiredDate) < new Date()
  }

  const getCardStatus = (card: Card) => {
    if (isExpired(card.expired)) {
      return {
        text: 'Expired',
        color: 'text-error-600 bg-error-50 border-error-200',
        icon: <AlertCircle className="w-4 h-4 text-error-600" />
      }
    }
    if (card.isActive) {
      return {
        text: 'Active',
        color: 'text-success-600 bg-success-50 border-success-200',
        icon: <CheckCircle className="w-4 h-4 text-success-600" />
      }
    }
    return {
      text: 'Inactive',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      icon: <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cards...</p>
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
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HSA Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
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
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Cards</h1>
          <p className="text-lg text-gray-600">View and manage your HSA debit cards</p>
        </div>

        {/* Card Controls */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCardNumbers(!showCardNumbers)}
                className="flex items-center space-x-2 btn-secondary"
              >
                {showCardNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showCardNumbers ? 'Hide' : 'Show'} Card Numbers</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {cards.filter(card => card.isActive && !isExpired(card.expired)).length} active cards
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <div className="card text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
            <p className="text-gray-600 mb-6">You haven't been issued any HSA debit cards yet.</p>
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Request New Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const status = getCardStatus(card)
              return (
                <div key={card.id} className="card hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-medium text-gray-900">HSA Card</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                      <div className="flex items-center space-x-1">
                        {status.icon}
                        <span>{status.text}</span>
                      </div>
                    </span>
                  </div>

                  {/* Card Number */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                        {formatCardNumber(card.number)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(card.number)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy card number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(card.created)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span className={`font-medium ${isExpired(card.expired) ? 'text-error-600' : ''}`}>
                        {formatDate(card.expired)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button className="flex-1 btn-secondary text-sm">
                        View Details
                      </button>
                      <button className="btn-error text-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Request New Card */}
        {cards.length > 0 && (
          <div className="mt-8 text-center">
            <button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Request New Card
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
