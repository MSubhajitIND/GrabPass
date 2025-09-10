// server/models/Registration.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegistrationSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  userName: String,
  email: String,
  studentCode: String,
  dept: String,
  paid: { type: Boolean, default: false },
  paymentProvider: String,
  paymentId: String,
  qrToken: String,
  createdAt: { type: Date, default: Date.now },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: Date
});

// Export existing compiled model if present (prevents OverwriteModelError)
module.exports = mongoose.models && mongoose.models.Registration
  ? mongoose.models.Registration
  : mongoose.model('Registration', RegistrationSchema);