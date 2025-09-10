// server/routes/ticket.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * GET /api/ticket?token=...
 * - Verifies the token using process.env.TICKET_SECRET (or 'ticket-secret' fallback)
 * - Returns registration + event info (safe for public consumption)
 */
router.get('/', async (req, res) => {
  try {
    const token = req.query.token || req.get('x-ticket-token') || (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) return res.status(400).json({ error: 'token query parameter required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.TICKET_SECRET || 'ticket-secret');
    } catch (err) {
      return res.status(401).json({ error: 'invalid or expired token' });
    }

    // Expect payload to include regId
    const regId = payload.regId || payload.regID || payload.id;
    if (!regId) return res.status(400).json({ error: 'invalid token payload' });

    const reg = await Registration.findById(regId).lean();
    if (!reg) return res.status(404).json({ error: 'registration not found' });

    const ev = await Event.findById(reg.eventId).lean();

    // Return safe info for ticket display
    res.json({
      registration: {
        _id: reg._id,
        userName: reg.userName,
        email: reg.email,
        studentCode: reg.studentCode,
        dept: reg.dept,
        paid: !!reg.paid,
        checkedIn: !!reg.checkedIn,
        createdAt: reg.createdAt,
        qrToken: reg.qrToken || token, // include token if present
      },
      event: ev ? {
        _id: ev._id,
        title: ev.title,
        description: ev.description,
        bannerUrl: ev.bannerUrl,
        startAt: ev.startAt,
      } : null
    });
  } catch (err) {
    console.error('GET /api/ticket error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

module.exports = router;