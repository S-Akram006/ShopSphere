const mongoose = require('mongoose');

// Mask sensitive credentials in MongoDB URI for safe logging
const maskURI = (uri) => {
  if (!uri) return '';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
};

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('No MongoDB connection string provided in environment variables.');
  }

  try {
    console.log(`[Database] Connecting to: ${maskURI(mongoURI)}`);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully to host: ${conn.connection.host} (${conn.connection.name})`);
  } catch (error) {
    console.error(`[Database Error] Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
