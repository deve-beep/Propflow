const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI provided in environment variables.
 * Exits the process on failure so orchestrators (PM2, Docker, Render) can restart cleanly.
 */
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected');
    });

    return conn;
  } catch (err) {
    console.error(`[MongoDB] Initial connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
