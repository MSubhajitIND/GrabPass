// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;

/**
 * CORS config
 * - Use environment variable CORS_ORIGINS to list allowed frontends (comma separated).
 * - If CORS_ORIGINS is not set, default to allowing all origins (useful for local dev).
 *
 * Examples:
 *  CORS_ORIGINS="https://grab-pass-web.vercel.app"
 *  CORS_ORIGINS="https://grab-pass-web.vercel.app,http://localhost:5173"
 */
const rawOrigins = process.env.CORS_ORIGINS || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// If no env provided, allow all origins (dev convenience). In production set CORS_ORIGINS.
const corsOptions =
  allowedOrigins.length > 0
    ? {
        origin: function (origin, callback) {
          // allow requests with no origin (curl, mobile apps, server-to-server)
          if (!origin) return callback(null, true);
          if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
          return callback(new Error("CORS not allowed for origin: " + origin));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      }
    : {
        origin: "*",
      };

app.use(cors(corsOptions));

// Ensure OPTIONS preflight requests are handled quickly
app.options("*", cors(corsOptions));

app.use(express.json()); // parse JSON bodies

// ----- Routes (keep existing) -----
app.use("/api/auth", require("./routes/auth")); // if exists
app.use("/api/events", require("./routes/event"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/ticket", require("./routes/ticket"));
app.use("/api/scan-verify", require("./routes/scanVerify"));
app.use("/api/staff", require("./routes/staff"));

// health / root
app.get("/", (req, res) => res.send("GrabPass server running"));
app.get("/health", (req, res) => res.json({ ok: true }));

// ----- start server with mongoose connection -----
async function start() {
  try {
    const mongoUrl =
      process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUrl) {
      throw new Error(
        "MONGODB_URI (or MONGO_URL / MONGO_URI) not set in environment variables"
      );
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // keep default pool size / other options as needed
    });
    console.log("Mongo connected");

    app.listen(port, () => console.log(`Server listening on ${port}`));
  } catch (err) {
    console.error("Failed to start server:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

start();
