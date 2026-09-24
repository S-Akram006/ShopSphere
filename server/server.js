require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://shop-sphere-lovat-tau.vercel.app',
];
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all valid web clients
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ShopSphere Enterprise Multi-Vendor Platform',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/seller', require('./routes/sellerRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ShopSphere Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;
