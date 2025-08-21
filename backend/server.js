const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const { router: authRoutes } = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const cardRoutes = require('./routes/cards');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`\n📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`   Headers:`, {
    'User-Agent': req.get('User-Agent'),
    'Authorization': req.get('Authorization') ? 'Bearer ***' : 'None',
    'Content-Type': req.get('Content-Type'),
    'Origin': req.get('Origin'),
    'Referer': req.get('Referer')
  });
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(`📤 ${statusColor} ${res.statusCode} - ${req.method} ${req.path} (${duration}ms)`);
    
    if (res.statusCode >= 400) {
      console.log(`   Error Response:`, res.locals.errorMessage || 'No error details');
    }
  });
  
  next();
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'HSA Backend API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('\n🚨 Global Error Handler:');
  console.error(`   Error: ${err.message}`);
  console.error(`   Stack: ${err.stack}`);
  console.error(`   Request: ${req.method} ${req.path}`);
  console.error(`   User Agent: ${req.get('User-Agent')}`);
  
  // Store error message for logging middleware
  res.locals.errorMessage = err.message;
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HSA Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
