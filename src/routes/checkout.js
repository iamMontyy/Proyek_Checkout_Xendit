const crypto = require('crypto');
const { Router } = require('express');
const config = require('../config');
const asyncHandler = require('../utils/async-handler');
const xendit = require('../services/xendit');
const db = require('../db');
const { PRODUCTS } = require('./products');

const router = Router();

function generateOrderId() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORDER-${stamp}-${random}`;
}

// Data pelanggan contoh memang bagian dari simulasi, bukan data asli.
// reference_id harus alfanumerik tanpa karakter spesial (syarat Xendit).
function dummyCustomer() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return {
    reference_id: `CUST${stamp}${random}`,
    type: 'INDIVIDUAL',
    email: 'pembeli.simulasi@example.com',
    mobile_number: '+6281200000000',
    individual_detail: { given_names: 'Pembeli', surname: 'Simulasi' },
  };
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId } = req.body || {};
    const product = PRODUCTS.find((item) => item.id === productId);
    if (!product) {
      return res.status(400).json({ error: `Produk dengan id "${productId ?? ''}" tidak dikenal.` });
    }

    if (!config.xendit.isConfigured) {
      return res.status(503).json({
        error: 'XENDIT_SECRET_KEY dan XENDIT_CALLBACK_TOKEN belum diisi di file .env.',
      });
    }

    const now = new Date().toISOString();
    const order = {
      order_id: generateOrderId(),
      product_id: product.id,
      product_name: product.name,
      gross_amount: product.price,
      payment_session_id: null,
      payment_url: null,
      status: 'pending',
      last_notification: null,
      created_at: now,
      updated_at: now,
    };
    db.saveOrder(order);

    const session = await xendit.createPaymentSession({
      orderId: order.order_id,
      amount: order.gross_amount,
      items: [
        {
          reference_id: product.id,
          name: product.name,
          type: 'PHYSICAL_PRODUCT',
          category: 'PROPERTI',
          net_unit_amount: product.price,
          quantity: 1,
          currency: 'IDR',
        },
      ],
      customer: dummyCustomer(),
      description: `Belajartoko: ${product.name}`,
    });

    order.payment_session_id = session.payment_session_id;
    order.payment_url = session.payment_link_url;
    order.updated_at = new Date().toISOString();
    db.saveOrder(order);

    res.status(201).json({
      order_id: order.order_id,
      status: order.status,
      payment_url: order.payment_url,
    });
  }),
);

module.exports = router;
