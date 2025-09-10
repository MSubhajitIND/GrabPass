// server/routes/scanVerify.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

const Registration = require('../models/Registration');
const Event = require('../models/Event'); // optional, for returning event details

// multer in-memory storage for small images
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

/**
 * decodeQrFromBuffer(buffer) -> Promise<string|null>
 * Uses Jimp + qrcode-reader to decode QR from image buffer.
 */
async function decodeQrFromBuffer(buffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(buffer)
      .then((image) => {
        const qr = new QrCode();
        qr.callback = (err, value) => {
          if (err) return reject(err);
          resolve((value && value.result) || null);
        };
        qr.decode(image.bitmap);
      })
      .catch(reject);
  });
}

/**
 * findRegistrationByToken(token)
 * - tries JWT verify -> payload.regId
 * - then looks up by qrToken field
 * - then tries by registration _id
 */
async function findRegistrationByToken(token) {
  if (!token) return null;

  // JWT heuristic (three parts)
  if (typeof token === 'string' && token.split('.').length === 3) {
    try {
      const secret = process.env.TICKET_SECRET || 'ticket-secret';
      const decoded = jwt.verify(token, secret);
      if (decoded && decoded.regId) {
        const reg = await Registration.findById(decoded.regId).lean();
        if (reg) return reg;
      }
    } catch (e) {
      // invalid jwt or expired -> continue to other lookup methods
    }
  }

  // try match by qrToken field
  const byQr = await Registration.findOne({ qrToken: token }).lean();
  if (byQr) return byQr;

  // try by id
  try {
    const byId = await Registration.findById(token).lean();
    if (byId) return byId;
  } catch (e) {
    // ignore invalid id format
  }

  return null;
}

/**
 * POST /api/scan-verify
 * Accepts:
 *  - JSON body { token: '...', eventId: '...', autoCheckin: true|false }
 *  - OR multipart form-data with file field 'qr' (image). If file provided the server will decode token from image.
 */
router.post('/', upload.single('qr'), async (req, res) => {
  try {
    const autoCheckin = req.body.autoCheckin === 'true' || req.query.autoCheckin === '1' || req.body.autoCheckin === true;
    const eventId = req.body.eventId || req.query.eventId;

    // token may come from body or from uploaded image
    let token = (req.body && req.body.token) || null;

    // If an uploaded image was provided, try to decode QR from it
    if (!token && req.file && req.file.buffer) {
      try {
        const decoded = await decodeQrFromBuffer(req.file.buffer);
        token = decoded;
      } catch (err) {
        console.warn('QR decode failed:', err && err.message ? err.message : err);
        return res.status(200).json({ ok: false, status: 'not_found', message: 'Could not decode QR from image' });
      }
    }

    if (!token) {
      return res.status(400).json({ ok: false, status: 'error', message: 'missing token' });
    }

    // If token is a URL containing ?token=..., extract it
    try {
      const u = new URL(token);
      const t = u.searchParams.get('token');
      if (t) token = t;
    } catch (e) {
      /* not a URL - ignore */
    }

    const reg = await findRegistrationByToken(token);
    if (!reg) {
      return res.status(200).json({ ok: false, status: 'not_found', message: 'Ticket not found' });
    }

    // If eventId provided, ensure match
    if (eventId && String(reg.eventId) !== String(eventId)) {
      return res.status(200).json({ ok: false, status: 'invalid_event', message: 'Ticket not valid for this event' });
    }

    // If already checked in, return used (but still return reg)
    if (reg.checkedIn) {
      return res.status(200).json({ ok: true, status: 'used', registration: reg });
    }

    // Optionally auto-checkin: update DB and return fresh document
    if (autoCheckin) {
      const updated = await Registration.findByIdAndUpdate(
        reg._id,
        { checkedIn: true, checkedInAt: new Date() },
        { new: true }
      ).lean();

      return res.status(200).json({ ok: true, status: 'valid', registration: updated });
    }

    // By default just return valid (without changing DB)
    // include event info optionally
    let ev = null;
    try {
      if (reg.eventId) ev = await Event.findById(reg.eventId).lean();
    } catch (e) { /* ignore */ }

    return res.status(200).json({ ok: true, status: 'valid', registration: reg, event: ev });
  } catch (err) {
    console.error('scanVerify error', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, status: 'error', message: err.message || 'server error' });
  }
});

module.exports = router;