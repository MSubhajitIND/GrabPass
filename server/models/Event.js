// server/models/Event.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },

  startAt: { type: Date },
  endAt: { type: Date },

  maxSeats: { type: Number, default: 100 },
  priceCents: { type: Number, default: 0 },

  registrationOpen: { type: Boolean, default: true },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  registeredCount: { type: Number, default: 0 },
});

// update updatedAt automatically
EventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Export existing compiled model if present (prevents OverwriteModelError)
module.exports = mongoose.models && mongoose.models.Event
  ? mongoose.models.Event
  : mongoose.model("Event", EventSchema);