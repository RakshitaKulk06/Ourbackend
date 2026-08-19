const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');


async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[db] MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
