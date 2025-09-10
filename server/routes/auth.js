const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d';

// register user (dev helper)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email+password required' });
    const hash = await bcrypt.hash(password, 10);
    const u = new User({ email, passwordHash: hash, role: role || 'user' });
    await u.save();
    res.json({ ok: true, id: u._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await u.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ uid: u._id, role: u.role, email: u.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, role: u.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
