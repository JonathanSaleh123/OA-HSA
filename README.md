# Human Interest OA - HSA (Health Savings Account) Application



## Project Structure

```
OA-HSA/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend service with SQLite Database
└── README.md         # This file
```

## Features

### 🔐 User Management
- **User Registration & Authentication**: Create and login to HSA accounts with JWT tokens
- **Profile Management**: View and manage user account information

### 🏦 HSA Account Management
- **Account Creation**: Automatic HSA account creation upon user registration
- **Balance Tracking**: Real-time account balance monitoring
- **Fund Deposits**: Add virtual funds to HSA accounts
- **Account Summary**: Comprehensive account statistics and insights

### 💳 Virtual Debit Card System
- **Card Issuance**: Generate virtual debit cards linked to HSA accounts
- **Card Management**: View, activate, and deactivate cards
- **Expiration Handling**: Automatic card expiration management
- **Security**: CVV generation and card number validation

### 💰 Medical Expense Processing
- **IRS Compliance**: IRS-qualified medical expense verification
- **Merchant Validation**: Real-time merchant code validation
- **Transaction Processing**: Secure HSA transaction processing
- **Medical vs Non-Medical**: Automatic expense classification and approval/decline

### 📊 Analytics & Reporting
- **Transaction History**: Complete spending history with filtering
- **Spending Analytics**: Medical vs non-medical expense breakdown
- **Success Rates**: Transaction approval/decline statistics
- **Performance Metrics**: Response times and system health monitoring

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Authentication**: JWT tokens

## Quick Start
### Prerequisites
- Node.js 18+ 
- npm or yarn


1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   npm run db:init
   
   # New Terminal: Install frontend dependencies
   cd frontend
   npm install
   ```


2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:3001

3. **Start Frontend Application**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

4. **Open Application**
   Navigate to http://localhost:3000 in your browser

### Testing the Backend
```bash
cd backend
npm test
```
This will run a comprehensive test suite to verify all API endpoints are working correctly.

## API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration with automatic HSA account creation
- `POST /api/auth/login` - User authentication and JWT token generation
- `GET /api/auth/profile` - Get authenticated user profile information

### 🏦 Account Management (`/api/accounts`)
- `GET /api/accounts` - Get current user's HSA account details
- `GET /api/accounts/:id` - Get specific account details (user must own the account)
- `POST /api/accounts/:id/deposit` - Deposit funds to HSA account
- `GET /api/accounts/:id/transactions` - Get transaction history for specific account
- `GET /api/accounts/:id/summary` - Get account summary and statistics

### 💳 Virtual Debit Cards (`/api/cards`)
- `POST /api/cards` - Issue new virtual debit card linked to HSA account
- `GET /api/cards` - Get all user's virtual debit cards
- `GET /api/cards/:id` - Get specific card details
- `DELETE /api/cards/:id` - Deactivate/delete virtual debit card
- `GET /api/cards/:id/transactions` - Get transaction history for specific card

### 💰 Transaction Processing (`/api/transactions`)
- `POST /api/transactions` - Process HSA transaction with medical expense validation
- `GET /api/transactions` - Get user's transaction history with pagination
- `GET /api/transactions/:id` - Get specific transaction details
- `GET /api/transactions/stats/summary` - Get transaction statistics and spending summary
- `POST /api/transactions/validate-merchant` - Validate merchant code for HSA eligibility

### 📊 Health & Monitoring
- `GET /health` - Backend health check endpoint

## Frontend Pages & Routes

### 🏠 Main Pages
- `/` - Landing page with login/registration
- `/dashboard` - Main dashboard with account overview and quick actions

### 📱 Dashboard Features
- `/dashboard/deposit` - Fund deposit interface
- `/dashboard/cards` - Virtual debit card management
- `/dashboard/transactions` - Transaction history and analytics
- `/dashboard/test-transaction` - Transaction testing and merchant validation


## Database Schema

### 🗄️ Core Tables
- **Users**: id, email, salt, pass_hash, created, updated
- **Account**: id, user_id, balance, created, updated
- **Debit_Cards**: id, user_id, account_id, number, cvv, created, expired
- **Transactions**: id, card_id, merchant_name, merchant_code, amount, status, timestamp
- **Merchant_Codes**: id, merchant_code, description, is_medical


