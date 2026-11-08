// Klien Xendit tanpa SDK: panggil Payments API (Payment Session) dengan fetch bawaan Node.

const config = require('../config');

// Auth Xendit memakai Basic dengan isi base64(secretKey + ":"),
// secretKey sebagai username, password kosong.
function authHeader() {
  return `Basic ${Buffer.from(`${config.xendit.secretKey}:`).toString('base64')}`;
}

// Membuat Payment Session tipe PAY dengan mode PAYMENT_LINK:
// Xendit menyediakan halaman checkout hosted, aplikasi cukup redirect ke payment_link_url.
// Return value berupa { payment_session_id, payment_link_url, status }.
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
    // Tanpa expires_at: Xendit default 30 menit setelah dibuat.
  };
  if (config.xendit.canRedirectBack) {
    // Kembali ke halaman status milik kita; order_id dibawa agar halaman langsung sasaran.
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
  return data; // berisi { payment_session_id, payment_link_url, status }
}

// Status terkini dari session; dipakai tombol "Cek Status" sebagai fallback webhook.
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
