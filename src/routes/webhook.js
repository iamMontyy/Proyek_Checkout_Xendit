const crypto = require('crypto');
const { Router } = require('express');
const config = require('../config');
const db = require('../db');
const { mapSessionStatus } = require('../utils/order-status');

const router = Router();
function verifyCallbackToken(headerToken) {
  const expected = config.xendit.callbackToken;
  if (!expected || typeof headerToken !== 'string') return false;
  if (headerToken.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headerToken));
}

router.post('/', (req, res) => {
  const notification = req.body || {};

  if (!verifyCallbackToken(req.get('x-callback-token'))) {
    console.warn(`[webhook] x-callback-token ditolak untuk reference_id ${notification?.data?.reference_id ?? '(kosong)'}`);
    return res.status(401).json({ error: 'x-callback-token tidak valid' });
  }

  const session = notification.data || {};
  const orderId = session.reference_id;

  const order = db.get(orderId);
  if (!order) {
    // Tetap 200 agar Xendit berhenti mengulang pengiriman untuk order yang tak dikenal.
    console.warn(`[webhook] reference_id tidak dikenal: ${orderId}`);
    return res.status(200).json({ received: true, note: 'reference_id tidak ditemukan' });
  }

  const previousStatus = order.status;
  order.status = mapSessionStatus(session.status || notification.event);
  order.updated_at = new Date().toISOString();
  order.last_notification = notification;
  db.saveOrder(order);

  console.log(`[webhook] ${order.order_id}: ${previousStatus} -> ${order.status} (event=${notification.event}, status=${session.status})`);
  res.status(200).json({ received: true, order_id: order.order_id, status: order.status });
});

module.exports = router;
