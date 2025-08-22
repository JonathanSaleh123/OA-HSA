const express = require('express');
const { runQuery, getRow, getRows } = require('../database/connection');
const { verifyToken } = require('./auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Helper function to calculate card status
const calculateCardStatus = (expiredDate) => {
  // Get current date in YYYY-MM-DD format for consistent comparison
  const now = new Date();
  const nowDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Handle invalid dates
  if (!expiredDate || isNaN(new Date(expiredDate).getTime())) {
    console.warn('Invalid expiration date:', expiredDate);
    return false;
  }
  // Compare date strings directly (YYYY-MM-DD format)
  const isActive = expiredDate > nowDate;
  return isActive;
};

// Generate virtual card number
const generateCardNumber = () => {
  // Generate a 16-digit card number (Visa format: 4XXXXXXXXXXXXXXX)
  const prefix = '4';
  const randomDigits = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + randomDigits;
};

// Generate CVV
const generateCVV = () => {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
};

// Calculate expiration date (5 years from now)
const calculateExpiration = () => {
  const now = new Date();
  const expiration = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
  return expiration.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};


// Issue new debit card
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId } = req.body;

    // Validate input
    if (!accountId) {
      return res.status(400).json({
        error: 'Account ID is required'
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

    // Generate card details
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const expired = calculateExpiration();

    // Create new debit card
    const cardResult = await runQuery(
      'INSERT INTO Debit_Cards (user_id, account_id, number, cvv, expired) VALUES (?, ?, ?, ?, ?)',
      [userId, accountId, cardNumber, cvv, expired]
    );

    res.status(201).json({
      message: 'Debit card issued successfully',
      card: {
        id: cardResult.lastID,
        number: cardNumber,
        cvv: cvv,
        expired: expired,
        accountId: accountId
      }
    });

  } catch (error) {
    console.error('Issue card error:', error);
    res.status(500).json({
      error: 'Internal server error while issuing card'
    });
  }
});


// Get user's debit cards
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all cards for the user
    const cards = await getRows(`
      SELECT 
        dc.id,
        dc.number,
        dc.cvv,
        dc.expired,
        dc.created,
        a.balance as account_balance
      FROM Debit_Cards dc
      JOIN Account a ON dc.account_id = a.id
      WHERE dc.user_id = ?
      ORDER BY dc.created DESC
    `, [userId]);

    res.json({
      cards: cards.map(card => ({
        id: card.id,
        number: card.number,
        cvv: card.cvv,
        expired: card.expired,
        created: card.created,
        accountBalance: card.account_balance,
        isActive: calculateCardStatus(card.expired)
      }))
    });

  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching cards'
    });
  }
});

// Get specific card details
router.get('/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.userId;

    // Get card details
    const card = await getRow(`
      SELECT 
        dc.*,
        a.balance as account_balance
      FROM Debit_Cards dc
      JOIN Account a ON dc.account_id = a.id
      WHERE dc.id = ? AND dc.user_id = ?
    `, [cardId, userId]);

    if (!card) {
      return res.status(404).json({
        error: 'Card not found or access denied'
      });
    }

    res.json({
      card: {
        id: card.id,
        number: card.number,
        cvv: card.cvv,
        expired: card.expired,
        created: card.created,
        accountId: card.account_id,
        accountBalance: card.account_balance,
        isActive: calculateCardStatus(card.expired)
      }
    });

  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching card'
    });
  }
});

// Deactivate card (mark as expired)
router.delete('/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.userId;

    // Verify card belongs to user
    const card = await getRow(
      'SELECT * FROM Debit_Cards WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      return res.status(404).json({
        error: 'Card not found or access denied'
      });
    }

    // Mark card as expired by setting expiration
    await runQuery(
      "UPDATE Debit_Cards SET expired = '2000-01-01 00:00:00' WHERE id = ?",
      [cardId]
    );

    // Get the updated card information
    const updatedCard = await getRow(`
      SELECT 
        dc.id,
        dc.number,
        dc.cvv,
        dc.expired,
        dc.created,
        a.balance as account_balance
      FROM Debit_Cards dc
      JOIN Account a ON dc.account_id = a.id
      WHERE dc.id = ? AND dc.user_id = ?
    `, [cardId, userId]);
    res.json({
      message: 'Card deactivated successfully',
      cardId: cardId,
      card: {
        id: updatedCard.id,
        number: updatedCard.number,
        cvv: updatedCard.cvv,
        expired: updatedCard.expired,
        created: updatedCard.created,
        accountBalance: updatedCard.account_balance,
        isActive: calculateCardStatus(updatedCard.expired)
      }
    });

  } catch (error) {
    console.error('Deactivate card error:', error);
    res.status(500).json({
      error: 'Internal server error while deactivating card'
    });
  }
});

// Get card transaction history
router.get('/:id/transactions', async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.userId;

    // Verify card belongs to user
    const card = await getRow(
      'SELECT id FROM Debit_Cards WHERE id = ? AND user_id = ?',
      [cardId, userId]
    );

    if (!card) {
      return res.status(404).json({
        error: 'Card not found or access denied'
      });
    }

    // Get transactions for this card
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
      LEFT JOIN Merchant_Codes mc ON t.merchant_code = mc.merchant_code
      WHERE t.card_id = ?
      ORDER BY t.timestamp DESC
      LIMIT 50
    `, [cardId]);

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
    console.error('Get card transactions error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching card transactions'
    });
  }
});
module.exports = router;
