# HSA (Health Savings Account) Application

A full-stack web application demonstrating the core lifecycle of an HSA: account creation, funding, card issuance, and transaction processing.

## Project Structure

```
intapp-HSA/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend service
├── database/          # SQLite database and migrations
└── README.md         # This file
```

## Features

- **User Registration & Authentication**: Create and manage HSA accounts
- **Account Management**: View balance and account details
- **Fund Deposits**: Add virtual funds to HSA accounts
- **Virtual Debit Cards**: Issue and manage cards linked to HSA accounts
- **Transaction Processing**: Validate medical expenses and process transactions
- **Medical Expense Validation**: IRS-qualified medical expense verification

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: SQLite
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Option 1: Automated Setup (Recommended)
```bash
# Make the startup script executable (first time only)
chmod +x start-dev.sh

# Run the automated startup script
./start-dev.sh
```

This script will:
- Install all dependencies
- Initialize the database
- Start both backend and frontend servers
- Open the application in your browser

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Initialize Database**
   ```bash
   cd backend
   npm run db:init
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:3001

4. **Start Frontend Application**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

5. **Open Application**
   Navigate to http://localhost:3000 in your browser

### Testing the Backend
```bash
cd backend
npm test
```

This will run a comprehensive test suite to verify all API endpoints are working correctly.

## Development Checkpoints

### Checkpoint 1: Basic Setup ✅
- [x] Project structure created
- [x] README with setup instructions

### Checkpoint 2: Backend Foundation ✅
- [x] Express server setup
- [x] Database schema and initialization
- [x] Basic API endpoints
- [x] Authentication system
- [x] Database utilities and connection management

### Checkpoint 3: Frontend Foundation ✅
- [x] Next.js app setup
- [x] Basic UI components
- [x] Authentication forms
- [x] Dashboard layout
- [x] Tailwind CSS styling

### Checkpoint 4: Core Features ✅
- [x] User registration/login
- [x] Account creation
- [x] Fund deposits
- [x] Card issuance
- [x] Transaction processing
- [x] Medical expense validation

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/accounts` - Create HSA account
- `POST /api/accounts/:id/deposit` - Deposit funds
- `POST /api/cards` - Issue debit card
- `POST /api/transactions` - Process transaction
- `GET /api/accounts/:id` - Get account details
- `GET /api/transactions` - Get transaction history

## Database Schema

- **Users**: id, email, salt, pass_hash, created, updated
- **Account**: id, user_id, balance, created, updated
- **Debit_Cards**: id, user_id, account_id, number, cvv, created, expired
- **Transactions**: id, card_id, merchant_name, merchant_code, amount, status, timestamp
- **Merchant_Codes**: id, merchant_code

## Contributing

This is a demonstration project. Follow the setup instructions to run locally.
