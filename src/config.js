// Muat variabel dari .env lalu baca dengan nilai default yang aman.
require('dotenv').config();

const port = Number(process.env.PORT) || 3000;

const config = {
  port,
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  xendit: {
    // Secret key "Development" (diawali xnd_development_) = test mode, tanpa uang asli.
    secretKey: process.env.XENDIT_SECRET_KEY || '',
    // Callback token dipakai memvalidasi header x-callback-token pada webhook.
    callbackToken: process.env.XENDIT_CALLBACK_TOKEN || '',
  },
};

config.xendit.isConfigured = Boolean(config.xendit.secretKey && config.xendit.callbackToken);

// Satu host untuk semua Products API: key yang Anda pakai (Development/Production)
// menentukan environment-nya, tidak ada host sandbox terpisah.
config.xendit.apiBaseUrl = 'https://api.xendit.co';

// URL kembali ke halaman status wajib HTTPS menurut API Session, jadi
// localhost (HTTP) dikosongkan dulu; isi jika APP_BASE_URL sudah ber-URL ngrok.
config.xendit.canRedirectBack = config.appBaseUrl.startsWith('https://');

module.exports = config;
