const { Router } = require('express');
const config = require('../config');
const asyncHandler = require('../utils/async-handler');
const xendit = require('../services/xendit');
const db = require('../db');
const { mapSessionStatus } = require('../utils/order-status');

const router = Router();
function toPublicOrder(order) {
  const { last_notification, ...publicFields } = order;
  return publicFields;
}

router.get('/:orderId', (req, res) => {
  const order = db.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  res.json(toPublicOrder(order));
});
router.get(
  '/:orderId/refresh',
  asyncHandler(async (req, res) => {
    const order = db.get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });

    if (!config.xendit.isConfigured) {
      return res.status(503).json({ error: 'XENDIT_SECRET_KEY dan XENDIT_CALLBACK_TOKEN belum diisi di file .env.' });
    }

    const session = await xendit.getSessionStatus(order.payment_session_id);
    const previousStatus = order.status;
    order.status = mapSessionStatus(session.status);
    order.updated_at = new Date().toISOString();
    order.last_notification = session;
    db.saveOrder(order);

    console.log(`[refresh] ${order.order_id}: ${previousStatus} -> ${order.status}`);
    res.json({ ...toPublicOrder(order), xendit_status: session.status });
  }),
);

module.exports = router;
