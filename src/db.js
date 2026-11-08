
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const orders = new Map();

if (fs.existsSync(DB_FILE)) {
  try {
    const rows = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    for (const order of rows) orders.set(order.order_id, order);
    console.log(`DB: ${orders.size} pesanan termuat dari ${path.relative(process.cwd(), DB_FILE)}`);
  } catch (error) {
    console.error(`DB: gagal membaca ${DB_FILE}, mulai dengan daftar kosong (${error.message})`);
  }
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify([...orders.values()], null, 2));
}

function get(orderId) {
  return orders.get(orderId) || null;
}

function saveOrder(order) {
  orders.set(order.order_id, order);
  save();
  return order;
}

function list() {
  return [...orders.values()];
}

module.exports = { get, saveOrder, list, DB_FILE };
