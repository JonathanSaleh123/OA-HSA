const express = require('express');
const { runQuery, getRow, getRows, runTransaction } = require('../database/connection');
const { verifyToken } = require('./auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get account details for id
router.get('/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;

    // Verify account belongs to user
    const account = await getRow(
      'SELECT * FROM Account WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found or access denied'
      });
    }

    res.json({
      account: {
        id: account.id,
        balance: account.balance,
        created: account.created,
        updated: account.updated
      }
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching account'
    });
  }
});

// Get user's HSA account
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's HSA account
    const account = await getRow(
      'SELECT * FROM Account WHERE user_id = ?',
      [userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'HSA account not found'
      });
    }

    res.json({
      account: {
        id: account.id,
        balance: account.balance,
        created: account.created,
        updated: account.updated
      }
    });

  } catch (error) {
    console.error('Get user account error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching account'
    });
  }
});

// Deposit funds to account
router.post('/:id/deposit', async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;
    const { amount } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Valid deposit amount is required'
      });
    }

    // Verify account belongs to user
    const account = await getRow(
      'SELECT * FROM Account WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found or access denied'
      });
    }

    // Update account balance
    const newBalance = parseFloat(account.balance) + parseFloat(amount);
    
    await runQuery(
      'UPDATE Account SET balance = ?, updated = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, accountId]
    );

    res.json({
      message: 'Deposit successful',
      account: {
        id: accountId,
        previousBalance: parseFloat(account.balance),
        newBalance: newBalance,
        depositAmount: parseFloat(amount)
      }
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      error: 'Internal server error during deposit'
    });
  }
});

// Get account transaction history
router.get('/:id/transactions', async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;

    // Verify account belongs to user
    const account = await getRow(
      'SELECT id FROM Account WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found or access denied'
      });
    }

    // Get transactions for this account
    const transactions = await getRows(`
      SELECT 
        t.id,
        t.merchant_name,
        t.merchant_code,
        t.amount,
        t.status,
        t.timestamp,
        mc.description as merchant_description,
        mc.is_medical
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE dc.account_id = ?
      ORDER BY t.timestamp DESC
      LIMIT 50
    `, [accountId]);

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        merchantName: t.merchant_name,
        merchantCode: t.merchant_code,
        merchantDescription: t.merchant_description,
        amount: t.amount,
        status: t.status,
        timestamp: t.timestamp,
        isMedical: Boolean(t.is_medical)
      }))
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching transactions'
    });
  }
});

// Get account summary (balance + recent activity)
router.get('/:id/summary', async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;

    // Verify account belongs to user
    const account = await getRow(
      'SELECT * FROM Account WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found or access denied'
      });
    }

    // Get recent transactions
    const recentTransactions = await getRows(`
      SELECT 
        t.merchant_name,
        t.amount,
        t.status,
        t.timestamp,
        mc.is_medical
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE dc.account_id = ?
      ORDER BY t.timestamp DESC
      LIMIT 5
    `, [accountId]);

    // Get active cards
    const activeCards = await getRows(`
      SELECT id, number, expired
      FROM Debit_Cards
      WHERE account_id = ? AND expired > datetime('now')
      ORDER BY created DESC
    `, [accountId]);

    res.json({
      summary: {
        accountId: account.id,
        balance: account.balance,
        created: account.created,
        updated: account.updated,
        recentTransactions: recentTransactions.map(t => ({
          merchantName: t.merchant_name,
          amount: t.amount,
          status: t.status,
          timestamp: t.timestamp,
          isMedical: Boolean(t.is_medical)
        })),
        activeCards: activeCards.map(c => ({
          id: c.id,
          number: c.number,
          expired: c.expired
        }))
      }
    });

  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching summary'
    });
  }
});

// Get balance history for charting
router.get('/:id/balance-history', async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Verify account belongs to user
    const account = await getRow(
      'SELECT * FROM Account WHERE id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found or access denied'
      });
    }

    // Get account creation date
    const accountCreated = new Date(account.created);
    const daysToShow = Math.min(parseInt(days), 365); // Max 1 year
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToShow);

    // Get all transactions for this account
    const transactions = await getRows(`
      SELECT 
        t.amount,
        t.status,
        t.timestamp,
        dc.account_id
      FROM Transactions t
      JOIN Debit_Cards dc ON t.card_id = dc.id
      WHERE dc.account_id = ? AND t.timestamp >= ?
      ORDER BY t.timestamp ASC
    `, [accountId, startDate.toISOString()]);

    // Calculate balance over time
    let currentBalance = parseFloat(account.balance);
    const balanceHistory = [];
    
    // Create a timeline with regular intervals
    const timeline = [];
    const endDate = new Date();
    const intervalDays = daysToShow <= 7 ? 1 : daysToShow <= 30 ? 3 : daysToShow <= 90 ? 7 : 14;
    
    for (let i = 0; i <= daysToShow; i += intervalDays) {
      const date = new Date();
      date.setDate(date.getDate() - (daysToShow - i));
      timeline.push(date);
    }
    
    // Add current balance point
    balanceHistory.push({
      date: new Date().toISOString(),
      balance: currentBalance,
      type: 'current'
    });

    // Work backwards through transactions to build balance history
    for (let i = transactions.length - 1; i >= 0; i--) {
      const transaction = transactions[i];
      if (transaction.status === 'approved') {
        currentBalance += parseFloat(transaction.amount);
      }
      
      balanceHistory.unshift({
        date: transaction.timestamp,
        balance: currentBalance,
        type: 'transaction'
      });
    }

    // Add account creation point if within range
    if (accountCreated >= startDate) {
      balanceHistory.unshift({
        date: account.created,
        balance: 0,
        type: 'created'
      });
    }

    // Create a comprehensive timeline with balance at each point
    const finalBalanceHistory = [];
    let lastKnownBalance = 0;
    
    // Sort all balance points by date
    const allBalancePoints = [...balanceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // For each timeline point, find the most recent balance
    timeline.forEach(date => {
      const dateStr = date.toISOString();
      
      // Find the most recent balance point before or equal to this date
      let balanceAtDate = lastKnownBalance;
      for (const point of allBalancePoints) {
        if (new Date(point.date) <= date) {
          balanceAtDate = point.balance;
        } else {
          break;
        }
      }
      
      finalBalanceHistory.push({
        date: dateStr,
        balance: balanceAtDate,
        type: 'timeline'
      });
      
      lastKnownBalance = balanceAtDate;
    });

    // If we have very few points, add some additional ones for better visualization
    if (finalBalanceHistory.length < 3) {
      const sampleDays = Math.min(7, daysToShow);
      for (let i = sampleDays; i >= 0; i--) {
        const sampleDate = new Date();
        sampleDate.setDate(sampleDate.getDate() - i);
        finalBalanceHistory.push({
          date: sampleDate.toISOString(),
          balance: currentBalance,
          type: 'sample'
        });
      }
    }

    res.json({
      balanceHistory: finalBalanceHistory
    });

  } catch (error) {
    console.error('Get balance history error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching balance history'
    });
  }
});

module.exports = router;
