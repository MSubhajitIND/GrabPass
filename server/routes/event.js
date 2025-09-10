// server/routes/events.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Event = require('../models/Event');
const Registration = require('../models/Registration'); // ensure this file exists

/**
 * requireAdmin middleware
 * Accepts demo-admin-token in dev so you can test without JWT signing.
 */
function requireAdmin(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'missing token' });

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

/* GET /api/events (optional query: upcoming=true or past=true) */
router.get('/', async (req, res) => {
  try {
    const { upcoming, past } = req.query;
    const now = new Date();
    const filter = {};
    if (upcoming === 'true') filter.startAt = { $gte: now };
    if (past === 'true') filter.startAt = { $lt: now };

    const events = await Event.find(filter).sort({ startAt: 1 }).lean();
    res.json(events);
  } catch (err) {
    console.error('GET /api/events error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/events/:id */
router.get('/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).lean();
    if (!ev) return res.status(404).json({ error: 'event not found' });
    res.json(ev);
  } catch (err) {
    console.error('GET /api/events/:id error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/events (admin only) */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description = '',
      bannerUrl = '',
      startAt,
      endAt,
      maxSeats = 100,
      priceCents = 0,
      registrationOpen = true,
    } = req.body || {};

    if (!title) return res.status(400).json({ error: 'title is required' });

    const ev = new Event({
      title: String(title).trim(),
      description,
      bannerUrl,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      maxSeats: Number(maxSeats) || 0,
      priceCents: Number(priceCents) || 0,
      registrationOpen: !!registrationOpen,
      createdBy: req.user?.id || undefined,
    });

    await ev.save();
    res.json(ev);
  } catch (err) {
    console.error('POST /api/events error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

/* PATCH /api/events/:id (admin only) */
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'bannerUrl', 'startAt', 'endAt', 'maxSeats', 'priceCents', 'registrationOpen'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        if (k === 'startAt' || k === 'endAt') updates[k] = req.body[k] ? new Date(req.body[k]) : undefined;
        else if (k === 'maxSeats' || k === 'priceCents') updates[k] = Number(req.body[k]);
        else updates[k] = req.body[k];
      }
    }
    updates.updatedAt = new Date();

    const ev = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!ev) return res.status(404).json({ error: 'event not found' });
    res.json(ev);
  } catch (err) {
    console.error('PATCH /api/events/:id error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

/* DELETE /api/events/:id (admin only) */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const ev = await Event.findByIdAndDelete(req.params.id);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    try {
      await Registration.deleteMany({ eventId: ev._id });
    } catch (cleanupErr) {
      console.warn('Could not delete registrations for event', ev._id, cleanupErr && cleanupErr.stack ? cleanupErr.stack : cleanupErr);
    }

    res.json({ status: 'deleted' });
  } catch (err) {
    console.error('DELETE /api/events/:id error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

module.exports = router;