// server/test-mongo.js
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("MONGO_URI not set in .env");
      process.exit(1);
    }

    console.log("Connecting to:", uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Connected to MongoDB!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  }
}

main();
