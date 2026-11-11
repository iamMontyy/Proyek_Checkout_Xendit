
const listEl = document.getElementById('product-list');
const alertEl = document.getElementById('alert');

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function showAlert(message, isError = true) {
  alertEl.textContent = message;
  alertEl.hidden = false;
  alertEl.classList.toggle('is-error', isError);
}

function setLoadingButtons(buttons, busy) {
  for (const button of buttons) {
    button.disabled = busy;
    if (busy) button.dataset.original = button.textContent;
    button.textContent = busy ? 'Membuat pesanan...' : button.dataset.original;
  }
}

function renderProducts(products) {
  listEl.setAttribute('aria-busy', 'false');
  listEl.replaceChildren();

  if (products.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'products__loading';
    empty.textContent = 'Belum ada produk yang bisa dibeli.';
    listEl.append(empty);
    return;
  }

  for (const product of products) {
    const item = document.createElement('li');
    item.className = 'products__item';

    const name = document.createElement('h2');
    name.className = 'products__name';
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'products__price';
    price.textContent = rupiah.format(product.price);

    const wrapper = document.createElement('div');
    wrapper.className = 'products__buy';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = 'Beli Sekarang';
    button.addEventListener('click', () => buy(product, [...listEl.querySelectorAll('.btn')]));

    wrapper.append(button);
    item.append(name, price, wrapper);
    listEl.append(item);
  }
}

async function buy(product, allButtons) {
  setLoadingButtons(allButtons, true);
  alertEl.hidden = true;

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      localStorage.setItem('last_order_id', data.order_id);
      window.location.assign(data.payment_url);
      return;
    }

    showAlert(data.error || `Gagal membuat pesanan (HTTP ${response.status}).`);
    setLoadingButtons(allButtons, false);
  } catch {
    showAlert('Tidak bisa menghubungi server. Pastikan backend berjalan.');
    setLoadingButtons(allButtons, false);
  }
}

(async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    renderProducts(data.products || []);
  } catch {
    listEl.setAttribute('aria-busy', 'false');
    showAlert('Gagal memuat daftar produk dari server.');
  }
})();
