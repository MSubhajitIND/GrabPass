const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const jwt = require('jsonwebtoken');

router.post('/checkin', async (req, res) => {
  try {
    const authHeader = req.get('Authorization') || '';
    const authToken = authHeader.replace('Bearer ','');
    if (!authToken) return res.status(401).json({ error: 'missing auth' });

    const authDecoded = jwt.verify(authToken, process.env.JWT_SECRET);
    if (authDecoded.role !== 'staff') return res.status(403).json({ error: 'staff only' });

    const { ticketToken } = req.body;
    if (!ticketToken) return res.status(400).json({ error: 'ticketToken required' });

    let ticketDecoded;
    try { ticketDecoded = jwt.verify(ticketToken, process.env.TICKET_SECRET); }
    catch(e) { return res.status(400).json({ error: 'invalid_or_expired_ticket' }); }

    const reg = await Registration.findById(ticketDecoded.regId);
    if (!reg) return res.status(404).json({ error: 'registration not found' });
    if (!reg.paid) return res.status(400).json({ error: 'not_paid' });
    if (reg.checkedIn) return res.json({ status: 'already_checked_in', userName: reg.userName, checkedInAt: reg.checkedInAt });

    reg.checkedIn = true;
    reg.checkedInAt = new Date();
    await reg.save();

    res.json({ status: 'ok', userName: reg.userName, studentCode: reg.studentCode });
  } catch(err){ console.error(err); res.status(500).json({ error: err.message }); }
});

module.exports = router;
