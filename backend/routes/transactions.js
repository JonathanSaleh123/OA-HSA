const express = require('express');
const { runQuery, getRow, getRows, runTransaction } = require('../database/connection');
const { verifyToken } = require('./auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Process a transaction
router.post('/', async (req, res) => {
  try {
    const { cardId, merchantName, merchantCode, amount } = req.body;

    // Validate input
    if (!cardId || !merchantName || !merchantCode || !amount) {
      return res.status(400).json({
        error: 'Card ID, merchant name, merchant code, and amount are required'
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    // Verify card belongs to user and is active
    const card = await getRow(`
      SELECT 
        dc.*,
        a.balance as account_balance,
        a.id as account_id
      FROM Debit_Cards dc
      JOIN Account a ON dc.account_id = a.id
      WHERE dc.id = ? AND dc.user_id = ? AND dc.expired > datetime('now')
    `, [cardId, req.user.userId]);

    if (!card) {
      return res.status(404).json({
        error: 'Card not found, access denied, or card is expired'
      });
    }

    // Check if account has sufficient balance
    if (parseFloat(card.account_balance) < parseFloat(amount)) {
      return res.status(400).json({
        error: 'Insufficient funds in HSA account',
        availableBalance: card.account_balance,
        requestedAmount: amount
      });
    }

    // Check if merchant code is valid and determine if it's medical
    const merchantInfo = await getRow(
      'SELECT * FROM Merchant_Codes WHERE merchant_code = ?',
      [merchantCode]
    );

    let isMedical = false;
    if (merchantInfo) {
      isMedical = Boolean(merchantInfo.is_medical);
    }

    // Determine transaction status based on medical validation
    let status = 'approved';
    let message = 'Transaction approved';

    if (!isMedical) {
      status = 'declined';
      message = 'Transaction declined: Non-medical expense not eligible for HSA funds';
    }

    // Create transaction record
    const transactionResult = await runTransaction([
      {
        query: 'INSERT INTO Transactions (card_id, merchant_name, merchant_code, amount, status) VALUES (?, ?, ?, ?, ?)',
        params: [cardId, merchantName, merchantCode, amount, status]
      }
    ]);

    // If transaction is approved, deduct from account balance
    if (status === 'approved') {
      const newBalance = parseFloat(card.account_balance) - parseFloat(amount);
      
      await runQuery(
        'UPDATE Account SET balance = ?, updated = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, card.account_id]
      );
    }

    res.status(201).json({
      message: message,
      transaction: {
        id: transactionResult[0].lastID,
        cardId: cardId,
        merchantName: merchantName,
        merchantCode: merchantCode,
        amount: parseFloat(amount),
        status: status,
        timestamp: new Date().toISOString(),
        isMedical: isMedical,
        merchantDescription: merchantInfo?.description || 'Unknown merchant type'
      },
      account: {
        previousBalance: parseFloat(card.account_balance),
        newBalance: status === 'approved' ? parseFloat(card.account_balance) - parseFloat(amount) : parseFloat(card.account_balance)
      }
    });

  } catch (error) {
    console.error('Process transaction error:', error);
    res.status(500).json({
      error: 'Internal server error while processing transaction'
    });
  }
});

// Get transaction history for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Get all transactions for user's cards
    const transactions = await getRows(`
      SELECT 
        t.id,
        t.merchant_name,
        t.merchant_code,
        t.amount,
        t.status,
        t.timestamp,
        mc.description as merchant_description,
        mc.is_medical,
        dc.number as card_number
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE dc.user_id = ?
      ORDER BY t.timestamp DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        merchantName: t.merchant_name,
        merchantCode: t.merchant_code,
        merchantDescription: t.merchant_description,
        amount: t.amount,
        status: t.status,
        timestamp: t.timestamp,
        isMedical: Boolean(t.is_medical),
        cardNumber: t.card_number
      }))
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching transactions'
    });
  }
});

// Get specific transaction details
router.get('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user.userId;

    // Get transaction details
    const transaction = await getRow(`
      SELECT 
        t.*,
        mc.description as merchant_description,
        mc.is_medical,
        dc.number as card_number
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE t.id = ? AND dc.user_id = ?
    `, [transactionId, userId]);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found or access denied'
      });
    }

    res.json({
      transaction: {
        id: transaction.id,
        merchantName: transaction.merchant_name,
        merchantCode: transaction.merchant_code,
        merchantDescription: transaction.merchant_description,
        amount: transaction.amount,
        status: transaction.status,
        timestamp: transaction.timestamp,
        isMedical: Boolean(transaction.is_medical),
        cardNumber: transaction.card_number
      }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching transaction'
    });
  }
});

// Get transaction statistics for user
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get transaction statistics
    const stats = await getRow(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN t.status = 'approved' THEN t.amount ELSE 0 END) as total_spent,
        SUM(CASE WHEN t.status = 'approved' AND mc.is_medical = 1 THEN t.amount ELSE 0 END) as medical_spent,
        SUM(CASE WHEN t.status = 'approved' AND (mc.is_medical = 0 OR mc.is_medical IS NULL) THEN t.amount ELSE 0 END) as non_medical_spent,
        COUNT(CASE WHEN t.status = 'declined' THEN 1 END) as declined_count
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE dc.user_id = ?
    `, [userId]);

    res.json({
      summary: {
        totalTransactions: stats.total_transactions,
        totalSpent: stats.total_spent || 0,
        medicalSpent: stats.medical_spent || 0,
        nonMedicalSpent: stats.non_medical_spent || 0,
        declinedCount: stats.declined_count,
        successRate: stats.total_transactions > 0 ? 
          ((stats.total_transactions - stats.declined_count) / stats.total_transactions * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching statistics'
    });
  }
});

// Validate merchant code
router.post('/validate-merchant', async (req, res) => {
  try {
    const { merchantCode } = req.body;

    if (!merchantCode) {
      return res.status(400).json({
        error: 'Merchant code is required'
      });
    }

    // Check if merchant code exists and get details
    const merchantInfo = await getRow(
      'SELECT * FROM Merchant_Codes WHERE merchant_code = ?',
      [merchantCode]
    );

    if (!merchantInfo) {
      return res.json({
        isValid: false,
        message: 'Unknown merchant code',
        isMedical: false
      });
    }

    res.json({
      isValid: true,
      merchantCode: merchantInfo.merchant_code,
      description: merchantInfo.description,
      isMedical: Boolean(merchantInfo.is_medical),
      message: merchantInfo.is_medical ? 
        'Medical expense eligible for HSA funds' : 
        'Non-medical expense not eligible for HSA funds'
    });

  } catch (error) {
    console.error('Validate merchant error:', error);
    res.status(500).json({
      error: 'Internal server error while validating merchant'
    });
  }
});

module.exports = router;
