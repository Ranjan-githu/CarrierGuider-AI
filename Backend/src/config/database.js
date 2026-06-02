const mongoose = require("mongoose");

console.log("MONGO_URI is set?", !!process.env.MONGO_URI);

async function connectToDB() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to Database successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

module.exports = connectToDB;