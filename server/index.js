// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // important: parse JSON bodies

// mount routes
app.use("/api/auth", require("./routes/auth")); // if you have auth
app.use("/api/events", require("./routes/event"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/ticket", require("./routes/ticket"));
app.use('/api/scan-verify', require('./routes/scanVerify'));
app.use('/api/staff', require('./routes/staff'));

// basic health route
app.get("/", (req, res) => res.send("GrabPass server running"));

// connect to MongoDB with good logging
async function start() {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUrl) throw new Error("MONGO_URL or MONGO_URI is not set in .env");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Mongo connected");
    app.listen(port, () => console.log(`Server listening on ${port}`));
  } catch (err) {
    console.error("Failed to start server:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

start();