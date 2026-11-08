const config = require('../config');
function authHeader() {
  return `Basic ${Buffer.from(`${config.xendit.secretKey}:`).toString('base64')}`;
}
async function createPaymentSession({ orderId, amount, items, customer, description }) {
  const payload = {
    reference_id: orderId,
    session_type: 'PAY',
    mode: 'PAYMENT_LINK',
    amount,
    currency: 'IDR',
    country: 'ID',
    customer,
    items,
    description,
    capture_method: 'AUTOMATIC',
    locale: 'id',

  };
  if (config.xendit.canRedirectBack) {
    const statusUrl = new URL('/status.html', `${config.appBaseUrl}/`);
    statusUrl.searchParams.set('order_id', orderId);
    payload.success_return_url = statusUrl.toString();
    payload.cancel_return_url = statusUrl.toString();
  }

  const response = await fetch(`${config.xendit.apiBaseUrl}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: authHeader() },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(`Xendit menolak permintaan Session (HTTP ${response.status})`);
    error.details = data;
    throw error;
  }
  return data; 
}
async function getSessionStatus(paymentSessionId) {
  const response = await fetch(`${config.xendit.apiBaseUrl}/sessions/${encodeURIComponent(paymentSessionId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: authHeader() },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(`Xendit gagal mengembalikan status Session (HTTP ${response.status})`);
    error.details = data;
    throw error;
  }
  return data;
}

module.exports = { createPaymentSession, getSessionStatus };
