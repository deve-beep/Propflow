require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = initSockets(httpServer);
  // Attach io to the Express app so controllers can reach it via req.app.get('io')
  // (used by notificationService to push real-time events after a DB write).
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`\n  PropFlow API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
