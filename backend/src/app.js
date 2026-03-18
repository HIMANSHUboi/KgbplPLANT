const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Allow any *.vercel.app subdomain and localhost
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, try again in 15 minutes' }
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/auth');
const shiftLogRoutes = require('./routes/shiftLogs');
const linesRoutes = require('./routes/lines');
const skusRoutes = require('./routes/skus');
const usersRoutes = require('./routes/users');
const plantsRoutes = require('./routes/plants');
const alertsRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const dmsRoutes = require('./routes/dms');
const performanceRoutes = require('./routes/performance');
const vehicleRoutes = require('./routes/vehicleRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/shift-logs', shiftLogRoutes);
app.use('/api/lines', linesRoutes);
app.use('/api/skus', skusRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dms', dmsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  const logger = require('./utils/logger');
  logger.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;