// server/scripts/create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.log('Usage: node create-admin.js email password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  let user = await User.findOne({ email });
  if (user) {
    user.passwordHash = hash;
    user.role = 'admin';
    await user.save();
    console.log('Updated existing user to admin:', email);
  } else {
    user = new User({ email, passwordHash: hash, role: 'admin' });
    await user.save();
    console.log('Created admin user:', email);
  }
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
