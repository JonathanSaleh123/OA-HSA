const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');
require('./utils/logRotator'); // Enable log rotation

// Routes
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
  logger.request(req);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.response(req, res, duration);
    logger.access(req, res, duration);
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
  logger.error('Global Error Handler', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });
  
  // Store error message for logging middleware
  res.locals.errorMessage = err.message;
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('HSA Backend Server started', {
    port: PORT,
    healthCheck: `http://localhost:${PORT}/health`,
    apiBase: `http://localhost:${PORT}/api`
  });
});

module.exports = app;
