const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('==================================================================');
    console.error(`[CRITICAL] MongoDB Connection Failed: ${error.message}`);
    console.error('Please ensure MongoDB is installed and running on your system.');
    console.error('The server will stay online, but Auth and History features will fail.');
    console.error('==================================================================');
    // We do not call process.exit(1) here so the Express server stays online
    // and can serve requests or handle file tasks (which work in temp folders).
  }
};

module.exports = connectDB;
