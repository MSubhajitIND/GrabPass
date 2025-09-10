// server/routes/registrations.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');

const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * requireAdmin helper - unchanged behavior
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

/**
 * requireStaffOrAdmin - allow staff OR admin
 * Accepts demo token 'demo-admin-token' in non-production which maps to staff/admin for dev convenience.
 */
function requireStaffOrAdmin(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'missing token' });

    // dev/demo convenience token
    if (process.env.NODE_ENV !== 'production' && token === 'demo-admin-token') {
      req.user = { id: 'demo', role: 'staff' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ error: 'invalid token' });
    if (decoded.role !== 'staff' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'staff/admin only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('requireStaffOrAdmin error', err && err.stack ? err.stack : err);
    return res.status(401).json({ error: 'invalid token' });
  }
}

/**
 * sendTicketEmail
 * Accepts qrDataUrl and optional pdfBuffer to attach
 */
async function sendTicketEmail(toEmail, subject, htmlBody, qrDataUrl = null, pdfBuffer = null) {
  let transporter;
  let usingEthereal = false;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE === 'true') || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    usingEthereal = true;
  }

  const attachments = [];
  if (qrDataUrl) {
    const matches = qrDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (matches) {
      const mime = matches[1];
      const base64 = matches[2];
      const buffer = Buffer.from(base64, 'base64');
      attachments.push({
        filename: 'ticket.png',
        content: buffer,
        contentType: mime,
        cid: 'ticket_qr@grabpass'
      });
    } else {
      attachments.push({ filename: 'ticket.png', path: qrDataUrl });
    }
  }

  if (pdfBuffer) {
    attachments.push({
      filename: 'ticket.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    });
  }

  const fromAddress = process.env.SMTP_USER ? `"GrabPass" <${process.env.SMTP_USER}>` : `"GrabPass" <no-reply@grabpass.local>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlBody,
      attachments,
    });

    const preview = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;
    return { messageId: info.messageId, previewUrl: preview };
  } catch (err) {
    console.error('sendTicketEmail error', err);
    throw err;
  }
}

/** helper to format date/time */
function fmtDate(dateStr) {
  try {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch {
    return String(dateStr);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Build simple HTML body (uses inline cid image for QR if present) */
function buildTicketEmailHtml({ ev, reg, ticketUrl, includeInlineQr }) {
  const qrImgHtml = includeInlineQr ? `<img src="cid:ticket_qr@grabpass" alt="Ticket QR" style="width:260px;height:260px;display:block;border-radius:6px"/>` : '';
  return `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; color:#111827;">
      <div style="background:#0f172a;color:white;padding:18px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0">${escapeHtml(ev.title)}</h2>
        <div style="margin-top:6px;font-size:13px;opacity:0.9">${escapeHtml(fmtDate(ev.startAt))}</div>
      </div>

      <div style="padding:18px;border:1px solid #e6e6e6;border-top:none;border-radius:0 0 8px 8px;">
        <p>Hi ${escapeHtml(reg.userName || '')},</p>
        <p>Thanks for registering for <strong>${escapeHtml(ev.title)}</strong>.</p>

        <table style="width:100%;margin-top:10px;border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;padding:6px;">
              <div style="font-size:12px;color:#6b7280">Name</div>
              <div style="font-weight:600">${escapeHtml(reg.userName || '—')}</div>

              <div style="margin-top:10px;font-size:12px;color:#6b7280">Email</div>
              <div style="font-weight:600">${escapeHtml(reg.email || '—')}</div>

              <div style="margin-top:10px;font-size:12px;color:#6b7280">Department</div>
              <div style="font-weight:600">${escapeHtml(reg.dept || '—')}</div>

              <div style="margin-top:10px;font-size:12px;color:#6b7280">Student code</div>
              <div style="font-weight:600">${escapeHtml(reg.studentCode || '—')}</div>
            </td>

            <td style="width:280px;padding:6px;text-align:center">
              ${qrImgHtml}
            </td>
          </tr>
        </table>

        <div style="margin-top:14px;font-size:13px;color:#374151">
          <div>Event: <strong>${escapeHtml(ev.title)}</strong></div>
          <div style="margin-top:6px">Date & time: <strong>${escapeHtml(fmtDate(ev.startAt))}</strong></div>
          <div style="margin-top:6px">Ticket ID: <strong style="font-family:monospace">${escapeHtml(String(reg._id))}</strong></div>
        </div>

        <p style="margin-top:16px">You can also open your ticket online: <a href="${ticketUrl}">View ticket</a></p>

        <p style="margin-top:20px;font-size:12px;color:#6b7280">Present this ticket at the event entrance. This email was sent by GrabPass.</p>
      </div>
    </div>
  `;
}

/**
 * Generate a PDF ticket as a Buffer using pdfkit.
 */
async function generateTicketPdf(ev, reg, qrDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.rect(40, 40, doc.page.width - 80, 70).fill('#0f172a');
      doc.fillColor('white').fontSize(20).text(ev.title || 'Event', 60, 55, { width: doc.page.width - 200 });

      // Date/time
      doc.moveDown();
      doc.fillColor('#111827').fontSize(12).text(`Date & time: ${fmtDate(ev.startAt)}`, { continued: false, margin: 20 });

      // HR
      doc.moveDown();
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, 140).lineTo(doc.page.width - 40, 140).stroke();

      // Event / Attendee section
      const leftX = 60;
      let y = 150;

      // Attendee details
      doc.fontSize(12).fillColor('#374151').text('Name', leftX, y);
      doc.fontSize(14).fillColor('#000').text(reg.userName || '—', leftX, y + 16);
      y += 44;

      doc.fontSize(12).fillColor('#374151').text('Email', leftX, y);
      doc.fontSize(14).fillColor('#000').text(reg.email || '—', leftX, y + 16);
      y += 44;

      doc.fontSize(12).fillColor('#374151').text('Department', leftX, y);
      doc.fontSize(14).fillColor('#000').text(reg.dept || '—', leftX, y + 16);
      y += 44;

      doc.fontSize(12).fillColor('#374151').text('Student Code', leftX, y);
      doc.fontSize(14).fillColor('#000').text(reg.studentCode || '—', leftX, y + 16);

      // Right area: QR image
      if (qrDataUrl) {
        const matches = qrDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
        if (matches) {
          const base64 = matches[2];
          const qrBuffer = Buffer.from(base64, 'base64');

          const qrSize = 200;
          const qrX = doc.page.width - 60 - qrSize;
          const qrY = 150;
          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        }
      }

      // Footer: Ticket ID and note
      doc.moveTo(40, doc.page.height - 160).lineTo(doc.page.width - 40, doc.page.height - 160).strokeColor('#e5e7eb').stroke();
      doc.fontSize(10).fillColor('#6b7280').text(`Ticket ID: ${reg._id}`, 60, doc.page.height - 140);
      doc.fontSize(10).fillColor('#6b7280').text('Present this ticket at the entrance. For help contact the organizer.', 60, doc.page.height - 120);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * GET /api/registrations?eventId=...
 * Now allows staff or admin
 */
router.get('/', requireStaffOrAdmin, async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId query required' });
    const regs = await Registration.find({ eventId }).sort({ createdAt: -1 }).lean();
    res.json(regs);
  } catch (err) {
    console.error('GET /api/registrations error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/registrations
 */
router.post('/', async (req, res) => {
  try {
    const { eventId, userName, email, studentCode, dept } = req.body || {};
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    if (ev.maxSeats && ev.registeredCount >= ev.maxSeats) return res.status(400).json({ error: 'event full' });

    const reg = new Registration({ eventId, userName, email, studentCode, dept });
    await reg.save();

    res.json({ registrationId: reg._id });
  } catch (err) {
    console.error('POST /api/registrations error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/registrations/:id/create-order
 */
router.post('/:id/create-order', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'registration not found' });

    const ev = await Event.findById(reg.eventId);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.json({ demo: true, message: 'Razorpay not configured on server; use demo-pay' });
    }

    const amount = Number(ev.priceCents || 0);
    if (amount <= 0) return res.status(400).json({ error: 'event has zero price; use demo-pay' });

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount,
      currency: 'INR',
      receipt: String(reg._id),
      payment_capture: 1,
    });

    res.json({ keyId, orderId: order.id, amount });
  } catch (err) {
    console.error('POST create-order error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/registrations/:id/verify-payment
 */
router.post('/:id/verify-payment', async (req, res) => {
  try {
    const { paymentId, orderId, signature } = req.body || {};
    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'missing payment parameters' });

    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'registration not found' });

    const ev = await Event.findById(reg.eventId);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured on server' });

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'invalid signature' });

    // mark paid
    reg.paid = true;
    reg.paymentProvider = 'razorpay';
    reg.paymentId = paymentId;

    // create ticket token (jwt)
    const payload = { regId: reg._id.toString(), eventId: reg.eventId.toString(), userName: reg.userName };
    const ticketToken = jwt.sign(payload, process.env.TICKET_SECRET || 'ticket-secret', { expiresIn: '30d' });

    reg.qrToken = ticketToken;
    await reg.save();

    // increment event.registeredCount now
    try {
      const refreshedEv = await Event.findById(ev._id);
      if (refreshedEv.maxSeats && refreshedEv.registeredCount >= refreshedEv.maxSeats) {
        console.warn('Event reached capacity at payment time', ev._id);
      } else {
        refreshedEv.registeredCount = (refreshedEv.registeredCount || 0) + 1;
        await refreshedEv.save();
      }
    } catch (incErr) {
      console.warn('Could not increment event.registeredCount:', incErr);
    }

    // generate QR dataURL
    const qrDataUrl = await qrcode.toDataURL(ticketToken);

    // generate PDF buffer
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateTicketPdf(ev, reg, qrDataUrl);
    } catch (pdfErr) {
      console.warn('PDF generation failed', pdfErr);
    }

    // ticket URL
    const ticketUrl = `${req.protocol}://${req.get('host')}/ticket?token=${encodeURIComponent(ticketToken)}`;

    // html with inline QR
    const html = buildTicketEmailHtml({ ev, reg, ticketUrl, includeInlineQr: true });

    let emailResult;
    try {
      emailResult = await sendTicketEmail(reg.email, `Your GrabPass ticket — ${ev.title}`, html, qrDataUrl, pdfBuffer);
    } catch (emailErr) {
      console.warn('ticket email failed', emailErr);
      emailResult = { error: String(emailErr) };
    }

    res.json({ status: 'ok', ticketToken, emailResult });
  } catch (err) {
    console.error('POST verify-payment error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/registrations/:id/demo-pay
 */
router.post('/:id/demo-pay', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'not found' });

    const ev = await Event.findById(reg.eventId);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    reg.paid = true;
    reg.paymentProvider = 'razorpay-demo';
    reg.paymentId = 'demo_' + Math.random().toString(36).slice(2);

    const payload = { regId: reg._id.toString(), eventId: reg.eventId.toString(), userName: reg.userName };
    const ticketToken = jwt.sign(payload, process.env.TICKET_SECRET || 'ticket-secret', { expiresIn: '30d' });

    reg.qrToken = ticketToken;
    await reg.save();

    // increment registeredCount here
    try {
      const refreshedEv = await Event.findById(ev._id);
      if (refreshedEv.maxSeats && refreshedEv.registeredCount >= refreshedEv.maxSeats) {
        console.warn('Event capacity reached at demo-pay', ev._id);
      } else {
        refreshedEv.registeredCount = (refreshedEv.registeredCount || 0) + 1;
        await refreshedEv.save();
      }
    } catch (incErr) {
      console.warn('Could not increment event.registeredCount on demo-pay:', incErr);
    }

    const qrDataUrl = await qrcode.toDataURL(ticketToken);

    // generate PDF
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateTicketPdf(ev, reg, qrDataUrl);
    } catch (pdfErr) {
      console.warn('PDF generation failed', pdfErr);
    }

    const ticketUrl = `${req.protocol}://${req.get('host')}/ticket?token=${encodeURIComponent(ticketToken)}`;
    const html = buildTicketEmailHtml({ ev, reg, ticketUrl, includeInlineQr: true });

    let emailResult;
    try {
      emailResult = await sendTicketEmail(reg.email, `Your GrabPass ticket — ${ev.title}`, html, qrDataUrl, pdfBuffer);
    } catch (emailErr) {
      console.warn('ticket email failed', emailErr);
      emailResult = { error: String(emailErr) };
    }

    res.json({ status: 'ok', ticketToken, emailResult });
  } catch (err) {
    console.error('demo-pay error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/registrations/:id/checkin (staff or admin)
 */
router.patch('/:id/checkin', requireStaffOrAdmin, async (req, res) => {
  try {
    const { checkedIn } = req.body;
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'registration not found' });

    reg.checkedIn = !!checkedIn;
    reg.checkedInAt = reg.checkedIn ? new Date() : null;
    await reg.save();
    res.json({ checkedIn: reg.checkedIn, checkedInAt: reg.checkedInAt });
  } catch (err) {
    console.error('checkin error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/registrations/:id/resend-email (admin)
 */
router.post('/:id/resend-email', requireAdmin, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: 'registration not found' });

    const ev = await Event.findById(reg.eventId);
    if (!ev) return res.status(404).json({ error: 'event not found' });

    if (!reg.qrToken) return res.status(400).json({ error: 'no ticket generated yet' });

    const qrDataUrl = await qrcode.toDataURL(reg.qrToken);
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateTicketPdf(ev, reg, qrDataUrl);
    } catch (pdfErr) {
      console.warn('PDF generation failed', pdfErr);
    }
    const ticketUrl = `${req.protocol}://${req.get('host')}/ticket?token=${encodeURIComponent(reg.qrToken)}`;
    const html = buildTicketEmailHtml({ ev, reg, ticketUrl, includeInlineQr: true });

    let result;
    try {
      result = await sendTicketEmail(reg.email, `Your GrabPass ticket — ${ev.title}`, html, qrDataUrl, pdfBuffer);
    } catch (emailErr) {
      console.warn('resend-email failed', emailErr);
      result = { error: String(emailErr) };
    }

    res.json({ status: 'resent', result });
  } catch (err) {
    console.error('resend-email error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;