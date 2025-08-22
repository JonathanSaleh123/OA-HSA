'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Card {
  id: number;
  number: string;
  expired: string;
  accountId: number;
}

interface MerchantValidation {
  isValid: boolean;
  merchantCode: string;
  description: string;
  isMedical: boolean;
  message: string;
}

interface TransactionResult {
  message: string;
  transaction: {
    id: number;
    cardId: number;
    merchantName: string;
    merchantCode: string;
    amount: number;
    status: string;
    timestamp: string;
    isMedical: boolean;
    merchantDescription: string;
  };
  account: {
    previousBalance: number;
    newBalance: number;
  };
}

export default function TestTransactionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | ''>('');
  const [merchantCode, setMerchantCode] = useState('');
  const [amount, setAmount] = useState('');
  const [validationResult, setValidationResult] = useState<MerchantValidation | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample merchant codes for testing
  const sampleMerchantCodes = [
    { code: '8011', description: 'Medical expense' },
    { code: '8021', description: 'Medical expense' },
    { code: '8031', description: 'Medical expense' },
    { code: '5411', description: 'Non-medical expense' },
    { code: '5812', description: 'Non-medical expense' },
    { code: '5541', description: 'Non-medical expense' },
  ];

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('hsa_token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out expired cards
        const activeCards = (data.cards || []).filter((card: Card) => {
          const expirationDate = new Date(card.expired);
          const now = new Date();
          return expirationDate > now;
        });
        setCards(activeCards);
        if (activeCards.length > 0) {
          setSelectedCard(activeCards[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      setError('Failed to fetch cards');
    }
  };

  const validateMerchant = async () => {
    if (!merchantCode.trim()) {
      setError('Please enter a merchant code');
      return;
    }

    setLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const token = localStorage.getItem('hsa_token');
      const response = await fetch('/api/transactions/validate-merchant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ merchantCode: merchantCode.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setValidationResult(data);
      } else {
        setError(data.error || 'Failed to validate merchant');
      }
    } catch (error) {
      console.error('Error validating merchant:', error);
      setError('Failed to validate merchant');
    } finally {
      setLoading(false);
    }
  };

  const processTransaction = async () => {
    if (!selectedCard || !merchantCode.trim() || !amount.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setTransactionResult(null);

    try {
      const token = localStorage.getItem('hsa_token');
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardId: selectedCard,
          merchantName: 'Test Transaction',
          merchantCode: merchantCode.trim(),
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show success notification
        alert(`Transaction ${data.transaction.status === 'approved' ? 'APPROVED' : 'DECLINED'}: ${data.message}`);
        // Reset the page
        resetPage();
      } else {
        setError(data.error || 'Failed to process transaction');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      setError('Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = (code: string) => {
    setMerchantCode(code);
  };

  const resetPage = () => {
    setMerchantCode('');
    setAmount('');
    setValidationResult(null);
    setTransactionResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaction Testing</h1>
          
          {/* Card Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Card
            </label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a card</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  Card ending in {card.number.slice(-4)} (Expires: {card.expired})
                </option>
              ))}
            </select>
          </div>

          {/* Sample Merchant Codes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Sample Merchant Codes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sampleMerchantCodes.map((merchant) => (
                <button
                  key={merchant.code}
                  onClick={() => fillSampleData(merchant.code)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm">Code: {merchant.code}</div>
                  <div className="text-xs text-gray-500">{merchant.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant Code
              </label>
              <input
                type="text"
                value={merchantCode}
                onChange={(e) => setMerchantCode(e.target.value)}
                placeholder="Enter merchant code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={validateMerchant}
                disabled={loading || !merchantCode.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Validating...' : 'Validate Merchant'}
              </button>
            </div>
          </div>

          {/* Process Transaction Button */}
          <div className="mb-6">
            <button
              onClick={processTransaction}
              disabled={loading || !selectedCard || !merchantCode.trim() || !amount.trim()}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
            >
              {loading ? 'Processing...' : 'Process Test Transaction'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className="mb-6 p-4 border rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Merchant Validation Result</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Valid:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {validationResult.isValid ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Code:</span>
                  <span className="ml-2 text-gray-900">{validationResult.merchantCode}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2 text-gray-900">{validationResult.description}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700">Medical Expense:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    validationResult.isMedical ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {validationResult.isMedical ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Message:</span>
                  <span className="ml-2 text-gray-900">{validationResult.message}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
