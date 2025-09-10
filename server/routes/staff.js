// server/routes/staff.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path if needed

// requireAdmin helper
function requireAdmin(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'missing token' });

    // demo token for local dev
    if (process.env.NODE_ENV !== 'production' && token === 'demo-admin-token') {
      req.user = { id: 'demo', role: 'admin' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    req.user = decoded;
    next();
  } catch (err) {
    console.error('requireAdmin error', err && err.stack ? err.stack : err);
    return res.status(401).json({ error: 'invalid token' });
  }
}

/** GET /api/staff
 *  admin-only: list all users with role staff/admin
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['staff', 'admin'] } }, '-password -passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    console.error('GET /api/staff error', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/staff
 *  admin-only: create staff/admin user
 *  body: { email, password, name, role }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'user already exists' });

    const u = new User({ email, name: name || '', role: role || 'staff' });
    await u.setPassword(password); // sets passwordHash
    await u.save();

    res.json({ ok: true, user: { id: u._id, email: u.email, name: u.name, role: u.role } });
  } catch (err) {
    console.error('POST /api/staff error', err);
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/staff/:id
 * admin-only: update name/role/password
 * body: { name?, role?, password? }
 */
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, role, password } = req.body || {};
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'user not found' });

    if (name !== undefined) u.name = name;
    if (role !== undefined) u.role = role;

    if (password) {
      await u.setPassword(password);
    }

    await u.save();
    const out = u.toObject();
    delete out.password; delete out.passwordHash;
    res.json({ ok: true, user: out });
  } catch (err) {
    console.error('PATCH /api/staff/:id error', err);
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/staff/:id
 * admin-only: delete staff user
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
      const deleted = await User.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'user not found' });
      // return a small safe payload (no password)
      res.json({ ok: true, id: deleted._id.toString(), email: deleted.email });
    } catch (err) {
      console.error('DELETE /api/staff/:id error', err);
      res.status(500).json({ error: err.message || 'delete failed' });
    }
  });

/** (Optional) POST /api/staff/login - basic staff login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await u.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const payload = { id: u._id.toString(), email: u.email, role: u.role || 'staff' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-jwt-secret', { expiresIn: '30d' });
    res.json({ token, role: payload.role, email: u.email, name: u.name });
  } catch (err) {
    console.error('staff login error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;