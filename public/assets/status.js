const cardEl = document.getElementById('order-card');
const alertEl = document.getElementById('alert');
const badgeEl = document.getElementById('order-status');
const payEl = document.getElementById('order-pay');
const refreshEl = document.getElementById('order-refresh');

const LABELS = {
  pending: 'Menunggu Pembayaran',
  paid: 'Pembayaran Berhasil',
  failed: 'Pembayaran Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Dana Dikembalikan',
};

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

let pollTimer = null;

function showAlert(message, isError = true) {
  alertEl.textContent = message;
  alertEl.hidden = false;
  alertEl.classList.toggle('is-error', isError);
}

function setBadge(status) {
  const label = LABELS[status] || status;
  badgeEl.textContent = label;
  badgeEl.className = `badge badge--${status}`;
}

function renderOrder(order) {
  cardEl.hidden = false;
  setBadge(order.status);
  document.getElementById('order-id').textContent = order.order_id;
  document.getElementById('order-product').textContent = order.product_name;
  document.getElementById('order-amount').textContent = rupiah.format(order.gross_amount);
  document.getElementById('order-created').textContent = dateTime.format(new Date(order.created_at));
  document.getElementById('order-updated').textContent = dateTime.format(new Date(order.updated_at));

  const canPay = order.status === 'pending' && Boolean(order.payment_url);
  payEl.hidden = !canPay;
  if (canPay) payEl.href = order.payment_url;

  refreshEl.hidden = order.status !== 'pending';
  refreshEl.disabled = false;

  stopPolling();
  if (order.status === 'pending') pollTimer = setInterval(loadOrder, 3000);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function loadOrder() {
  const orderId = document.getElementById('order-id').textContent;
  if (!orderId) return;
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    if (response.status === 404) {
      stopPolling();
      showAlert('Pesanan tidak ditemukan di database. Periksa kembali order_id-nya.');
      return;
    }
    const data = await response.json();
    renderOrder(data);
  } catch {
    stopPolling();
    showAlert('Tidak bisa menghubungi server. Pastikan backend berjalan.');
    refreshEl.disabled = false;
  }
}

(async function init() {
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order_id') || localStorage.getItem('last_order_id');

  if (!orderId) {
    showAlert('Tidak ada order_id di URL. Mulai dari halaman produk untuk membuat pesanan.');
    return;
  }
  localStorage.setItem('last_order_id', orderId);
  refreshEl.addEventListener('click', refreshFromXendit);
  await loadOrder();
  const loadingEl = document.getElementById('order-loading');
  if (loadingEl) loadingEl.hidden = true;
})();

async function refreshFromXendit() {
  const orderId = document.getElementById('order-id').textContent;
  if (!orderId) return;
  refreshEl.disabled = true;
  alertEl.hidden = true;

  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/refresh`);
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      renderOrder(data);
      if (data.status === 'pending') {
        showAlert('Xendit masih mencatat status menunggu pembayaran.', false);
      }
      return;
    }
    showAlert(data.error || `Gagal memuat status (HTTP ${response.status}).`);
    refreshEl.disabled = false;
  } catch {
    showAlert('Tidak bisa menghubungi server. Pastikan backend berjalan.');
    refreshEl.disabled = false;
  }
}
