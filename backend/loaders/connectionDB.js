const mongoose = require("mongoose");
const { MONGO_URI } = process.env; // You're destructuring MONGO_URI here
const logger = require("./logger");

module.exports = async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    
    // FIX: Use MONGO_URI (the variable) instead of env.MONGO_URI
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info("✅ MongoDB connected successfully");
    
    // Optional: Add event listeners for better connection monitoring
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });
    
    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
    
  } catch (error) {
    logger.error("❌ MongoDB connection failed:", error.message);
    throw error; // Re-throw to handle in app.js
  }
};