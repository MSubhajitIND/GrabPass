// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;

// CORS: allow specific frontend origin in production, * in dev
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json()); // parse JSON bodies

// mount routes
app.use("/api/auth", require("./routes/auth")); // if exists
app.use("/api/events", require("./routes/event"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/ticket", require("./routes/ticket"));
app.use("/api/scan-verify", require("./routes/scanVerify"));
app.use("/api/staff", require("./routes/staff"));

// health check
app.get("/", (req, res) => res.send("GrabPass server running"));
app.get("/health", (req, res) => res.json({ ok: true }));

async function start() {
  try {
    const mongoUrl =
      process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUrl) {
      throw new Error("MONGODB_URI (or MONGO_URL/MONGO_URI) not set in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("Mongo connected");

    app.listen(port, () => console.log(`Server listening on ${port}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
