const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const leadRoutes = require('./routes/leadRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const dealRoutes = require('./routes/dealRoutes');
const agentRoutes = require('./routes/agentRoutes');
const developerRoutes = require('./routes/developerRoutes');
const projectRoutes = require('./routes/projectRoutes');
const unitRoutes = require('./routes/unitRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const companyRoutes = require('./routes/companyRoutes');

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/register-company', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'PropFlow API is healthy', timestamp: new Date() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/deals', dealRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/developers', developerRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/units', unitRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/investment', investmentRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
