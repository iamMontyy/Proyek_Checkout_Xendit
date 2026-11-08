const path = require('path');
const express = require('express');
const config = require('./src/config');
const { router: productsRouter } = require('./src/routes/products');
const checkoutRouter = require('./src/routes/checkout');
const webhookRouter = require('./src/routes/webhook');
const ordersRouter = require('./src/routes/orders');

const app = express();

app.use(express.json({ limit: '256kb' }));

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`);
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/products', productsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/orders', ordersRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
});

app.use((error, req, res, next) => {
  console.error(`[error] ${req.method} ${req.originalUrl}: ${error.message}`);
  if (error.details) console.error('[error] detail PG:', error.details);
  res.status(500).json({ error: 'Terjadi kesalahan di server' });
});

app.listen(config.port, () => {
  const mode = !config.xendit.isConfigured ? 'BELUM TERISI' : (config.xendit.secretKey.startsWith('xnd_development_') ? 'TEST MODE' : 'PRODUCTION');
  console.log(`Server berjalan di ${config.appBaseUrl} (Xendit: ${mode})`);
  if (!config.xendit.isConfigured) {
    console.log('Perhatian: XENDIT_SECRET_KEY / XENDIT_CALLBACK_TOKEN masih kosong di .env');
    console.log('Halaman produk akan menyuruh Anda mengisinya sampai keduanya terisi.');
  }
});
