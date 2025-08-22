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
  AlertCircle,
  X,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
}

interface Card {
  id: number
  number: string
  cvv: string
  expired: string
  created: string
  isActive: boolean
  accountBalance?: number
  accountId?: number
}

interface NewCard {
  id: number
  number: string
  cvv: string
  expired: string
  accountId: number
}

export default function CardsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<any>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCardNumbers, setShowCardNumbers] = useState(false)
  const [showCVV, setShowCVV] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [isRequestingCard, setIsRequestingCard] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [cardTransactions, setCardTransactions] = useState<any[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAccount()
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
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            toast.error(errorData.error || 'Failed to fetch cards')
          } catch (parseError) {
            toast.error('Failed to fetch cards')
          }
        } else {
          // Handle non-JSON error responses (like rate limiting)
          const errorText = await response.text()
          console.error('Non-JSON error response:', errorText)
          if (errorText.includes('Too many requests') || errorText.includes('Rate limit')) {
            toast.error('Rate limit exceeded. Please try again later.')
          } else {
            toast.error('Failed to fetch cards')
          }
        }
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

  const requestNewCard = async () => {
    if (!account) {
      toast.error('Account information not available')
      return
    }

    setIsRequestingCard(true)

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountId: account.id })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('New card issued successfully!')
        
        // Add the new card to the list
        const newCard: Card = {
          id: data.card.id,
          number: data.card.number,
          cvv: data.card.cvv,
          expired: data.card.expired,
          created: new Date().toISOString(),
          isActive: true,
          accountId: data.card.accountId
        }
        
        setCards(prev => [newCard, ...prev])
        setShowRequestForm(false)
      } else {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            toast.error(errorData.error || 'Failed to issue new card')
          } catch (parseError) {
            toast.error('Failed to issue new card')
          }
        } else {
          // Handle non-JSON error responses (like rate limiting)
          const errorText = await response.text()
          console.error('Non-JSON error response:', errorText)
          if (errorText.includes('Too many requests') || errorText.includes('Rate limit')) {
            toast.error('Rate limit exceeded. Please try again later.')
          } else {
            toast.error('Failed to issue new card')
          }
        }
      }
    } catch (error) {
      console.error('Request card error:', error)
      toast.error('Failed to request new card')
    } finally {
      setIsRequestingCard(false)
    }
  }

  const viewCardDetails = async (card: Card) => {
    setSelectedCard(card)
    setShowCardDetails(true)
    await fetchCardTransactions(card.id)
  }

  const fetchCardTransactions = async (cardId: number) => {
    setIsLoadingTransactions(true)
    
    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch(`/api/cards/${cardId}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCardTransactions(data.transactions)
      } else {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            console.error('Card transactions error:', errorData.error)
          } catch (parseError) {
            console.error('Failed to parse card transactions error')
          }
        } else {
          // Handle non-JSON error responses (like rate limiting)
          const errorText = await response.text()
          console.error('Non-JSON error response for card transactions:', errorText)
        }
      }
    } catch (error) {
      console.error('Card transactions error:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const hasActiveCards = () => {
    return cards.some(card => {
      // Check if card is marked as active by backend
      return card.isActive
    })
  }

  const deactivateCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to deactivate this card? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('hsa_token')
      
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Card deactivated successfully')
        
        // Update the specific card in the local state with the response data
        setCards(prev => prev.map(card => 
          card.id === cardId 
            ? {
                ...card,
                expired: data.card.expired,
                isActive: data.card.isActive
              }
            : card
        ))
        
        // If we're viewing card details, close the modal
        if (showCardDetails && selectedCard?.id === cardId) {
          setShowCardDetails(false)
          setSelectedCard(null)
        }
      } else {
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            toast.error(errorData.error || 'Failed to deactivate card')
          } catch (parseError) {
            toast.error('Failed to deactivate card')
          }
        } else {
          // Handle non-JSON error responses (like rate limiting)
          const errorText = await response.text()
          console.error('Non-JSON error response:', errorText)
          if (errorText.includes('Too many requests') || errorText.includes('Rate limit')) {
            toast.error('Rate limit exceeded. Please try again later.')
          } else {
            toast.error('Failed to deactivate card')
          }
        }
      }
    } catch (error) {
      console.error('Deactivate card error:', error)
      toast.error('Failed to deactivate card')
    }
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

  const getCardStatus = (card: Card) => {
    if (card.isActive) {
      return {
        text: 'Active',
        color: 'text-success-600 bg-success-50 border-success-200',
        icon: <CheckCircle className="w-4 h-4 text-success-600" />
      }
    } else {
      return {
        text: 'Inactive',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        icon: <AlertCircle className="w-4 h-4 text-gray-600" />
      }
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
              <h1 className="text-2xl font-bold text-gray-900">HSA by Human Interest</h1>
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
              
              <button
                onClick={() => setShowCVV(!showCVV)}
                className="flex items-center space-x-2 btn-secondary"
              >
                {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showCVV ? 'Hide' : 'Show'} CVV</span>
              </button>
              
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Request New Card</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {cards.filter(card => card.isActive).length} active cards
            </div>
          </div>
        </div>

        {/* Card Request Form */}
        {showRequestForm && (
          <div className="card mb-6 border-2 border-primary-200 bg-primary-50">
            <div className="card-header">
              <h3 className="card-title text-primary-900">Request New HSA Debit Card</h3>
              <p className="card-subtitle text-primary-700">
                A new virtual debit card will be issued for your HSA account
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">
                    Account Balance
                  </label>
                  <div className="text-lg font-semibold text-primary-900">
                    {account ? `$${account.balance.toFixed(2)}` : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Active Card Warning */}
              {hasActiveCards() && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-warning-600" />
                    <div>
                      <h4 className="text-sm font-medium text-warning-800">Active Card Required</h4>
                      <p className="text-sm text-warning-700">
                        You must deactivate your current active card before requesting a new one. 
                        Only one active card is allowed per account.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={requestNewCard}
                  disabled={isRequestingCard || !account || hasActiveCards()}
                  className="btn-primary disabled:opacity-50"
                >
                  {isRequestingCard ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Issuing Card...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Issue New Card
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <div className="card text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
            <p className="text-gray-600 mb-6">You haven't been issued any HSA debit cards yet.</p>
            <button 
              onClick={() => setShowRequestForm(true)}
              disabled={hasActiveCards()}
              className="btn-primary disabled:opacity-50"
              title={hasActiveCards() ? 'Deactivate current card first' : 'Request new card'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Request New Card
            </button>
            {hasActiveCards() && (
              <p className="text-sm text-gray-500 mt-2">
                Deactivate your current active card to request a new one
              </p>
            )}
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

                  {/* CVV */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                        {showCVV ? card.cvv : '***'}
                      </code>
                      <button
                        onClick={() => copyToClipboard(card.cvv)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy CVV"
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
                      <span className={`font-medium ${!card.isActive ? 'text-error-600' : ''}`}>
                        {formatDate(card.expired)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => viewCardDetails(card)}
                        className="flex-1 btn-secondary text-sm"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => deactivateCard(card.id)}
                        disabled={!card.isActive}
                        className="btn-error text-sm disabled:opacity-50"
                        title={!card.isActive ? 'Card already inactive' : 'Deactivate card'}
                      >
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
            <button 
              onClick={() => setShowRequestForm(true)}
              disabled={hasActiveCards()}
              className="btn-primary disabled:opacity-50"
              title={hasActiveCards() ? 'Deactivate current card first' : 'Request new card'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Request New Card
            </button>
            {hasActiveCards() && (
              <p className="text-sm text-gray-500 mt-2">
                Deactivate your current active card to request a new one
              </p>
            )}
          </div>
        )}
      </main>

      {/* Card Details Modal */}
      {showCardDetails && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Card Details</h2>
                <button
                  onClick={() => setShowCardDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Card Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-lg">
                        {selectedCard.number}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedCard.number)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy full card number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-lg">
                        {selectedCard.cvv}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedCard.cvv)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Copy CVV"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCard.isActive
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {selectedCard.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                    <p className="text-gray-900">{formatDate(selectedCard.created)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expires</label>
                    <p className={`text-gray-900 ${!selectedCard.isActive ? 'text-error-600' : ''}`}>
                      {formatDate(selectedCard.expired)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Balance</label>
                    <p className="text-2xl font-bold text-primary-600">
                      {account ? `$${account.balance.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card ID</label>
                    <p className="text-gray-900 font-mono">{selectedCard.id}</p>
                  </div>
                </div>
              </div>

              {/* Card Transactions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                
                {isLoadingTransactions ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading transactions...</p>
                  </div>
                ) : cardTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions yet</p>
                    <p className="text-sm text-gray-500">Transactions will appear here when you use this card</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cardTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.isMedical ? 'bg-success-500' : 'bg-error-500'
                          }`} title={transaction.isMedical ? 'Medical Expense' : 'Non-Medical Expense'}></div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.merchantName}</p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${transaction.amount.toFixed(2)}
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
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCardDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => deactivateCard(selectedCard.id)}
                  disabled={!selectedCard.isActive}
                  className="btn-error disabled:opacity-50"
                >
                  Deactivate Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
