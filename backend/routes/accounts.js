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
    
    // Create a timeline with regular intervals
    const timeline = [];
    const intervalDays = daysToShow <= 7 ? 1 : daysToShow <= 30 ? 3 : daysToShow <= 90 ? 7 : 14;
    
    // Ensure we include today in the timeline
    for (let i = 0; i <= daysToShow; i += intervalDays) {
      // Create date for the start of the day in local timezone
      const date = new Date();
      date.setDate(date.getDate() - (daysToShow - i));
      date.setHours(0, 0, 0, 0); // Set to start of day
      timeline.push(date);
    }
    
    // Always include today if it's not already in the timeline
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayExists = timeline.some(date => 
      date.getFullYear() === todayDate.getFullYear() &&
      date.getMonth() === todayDate.getMonth() &&
      date.getDate() === todayDate.getDate()
    );
    
    if (!todayExists) {
      timeline.push(todayDate);
    }
    
    // Sort timeline to ensure proper order
    timeline.sort((a, b) => a.getTime() - b.getTime());
    
    // Create a comprehensive balance history
    const finalBalanceHistory = [];
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate balance at each timeline point
    timeline.forEach(date => {
      const dateStr = date.toISOString();
      
      // For the current day, use the actual current balance
      const isToday = date.getFullYear() === todayDate.getFullYear() &&
                     date.getMonth() === todayDate.getMonth() &&
                     date.getDate() === todayDate.getDate();
      
      let balanceAtDate;
      if (isToday) {
        balanceAtDate = currentBalance;
      } else {
        // For past dates, calculate balance by working backwards from current balance
        let balanceAtThisDate = currentBalance;
        
        // Subtract all transactions that happened after this date
        for (const transaction of sortedTransactions) {
          const transactionDate = new Date(transaction.timestamp);
          transactionDate.setHours(0, 0, 0, 0);
          
          if (transactionDate > date && transaction.status === 'approved') {
            balanceAtThisDate -= parseFloat(transaction.amount);
          }
        }
        
        balanceAtDate = balanceAtThisDate;
      }
      
      finalBalanceHistory.push({
        date: dateStr,
        balance: balanceAtDate,
        type: 'timeline'
      });
    });

    // If we have very few points or all balances are 0, add some sample data
    if (finalBalanceHistory.length < 3 || finalBalanceHistory.every(point => point.balance === 0)) {
      const sampleDays = Math.min(7, daysToShow);
      for (let i = sampleDays; i >= 0; i--) {
        const sampleDate = new Date();
        sampleDate.setDate(sampleDate.getDate() - i);
        sampleDate.setHours(0, 0, 0, 0);
        
        // Use current balance for all sample points if no transactions exist
        const sampleBalance = sortedTransactions.length === 0 ? currentBalance : 
          finalBalanceHistory.find(point => point.balance > 0)?.balance || currentBalance;
        
        finalBalanceHistory.push({
          date: sampleDate.toISOString(),
          balance: sampleBalance,
          type: 'sample'
        });
      }
    }

    // Ensure we have meaningful data
    const hasNonZeroBalance = finalBalanceHistory.some(point => point.balance > 0);
    const hasTransactions = sortedTransactions.length > 0;
    
    // If no transactions and no non-zero balances, use current balance for all points
    if (!hasTransactions && !hasNonZeroBalance && currentBalance > 0) {
      finalBalanceHistory.forEach(point => {
        point.balance = currentBalance;
      });
    }
    
    res.json({
      balanceHistory: finalBalanceHistory,
      debug: {
        currentBalance,
        transactionCount: sortedTransactions.length,
        hasNonZeroBalance,
        timeframe: daysToShow
      }
    });

  } catch (error) {
    console.error('Get balance history error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching balance history'
    });
  }
});

module.exports = router;
