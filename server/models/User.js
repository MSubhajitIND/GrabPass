// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  name: { type: String, default: "" },
  // some code used `password` and some used `passwordHash`.
  // We allow either, but prefer passwordHash for verification.
  password: { type: String },        // may contain hashed password in some older code
  passwordHash: { type: String },    // canonical hashed password field
  role: { type: String, enum: ['admin','staff','user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Virtual setter for plaintext password (optional convenience).
// Usage: user.setPassword("plaintext") or set `user.passwordPlain = "..."`;
UserSchema.methods.setPassword = async function (plain) {
  const hash = await bcrypt.hash(plain, 10);
  this.passwordHash = hash;
  // keep `password` as-is for backward compatibility only if needed.
  return hash;
};

// synchronous version if you prefer (not used by our routes)
UserSchema.methods.setPasswordSync = function (plain) {
  const hash = bcrypt.hashSync(plain, 10);
  this.passwordHash = hash;
  return hash;
};

// Verify password against either passwordHash or password (whichever exists).
UserSchema.methods.verifyPassword = function (plain) {
  const hashed = this.passwordHash || this.password || "";
  return bcrypt.compare(plain, hashed);
};

// toJSON / toObject: remove sensitive fields
UserSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    delete ret.password;
    delete ret.passwordHash;
    return ret;
  }
});

// Export existing compiled model if present (prevents OverwriteModelError)
module.exports = mongoose.models && mongoose.models.User
  ? mongoose.models.User
  : mongoose.model('User', UserSchema);