
require('dotenv').config();

const port = Number(process.env.PORT) || 3000;

const config = {
  port,
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  xendit: {

    secretKey: process.env.XENDIT_SECRET_KEY || '',

    callbackToken: process.env.XENDIT_CALLBACK_TOKEN || '',
  },
};

config.xendit.isConfigured = Boolean(config.xendit.secretKey && config.xendit.callbackToken);

config.xendit.apiBaseUrl = 'https://api.xendit.co';

config.xendit.canRedirectBack = config.appBaseUrl.startsWith('https://');

module.exports = config;
