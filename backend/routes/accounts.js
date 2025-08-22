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

module.exports = router;
