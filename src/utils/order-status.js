const SESSION_STATUS = {
  ACTIVE: 'pending',
  COMPLETED: 'paid',
  EXPIRED: 'expired',
  CANCELED: 'failed',
};

function mapSessionStatus(sessionStatus) {
  return SESSION_STATUS[String(sessionStatus || '').toUpperCase().trim()] || 'pending';
}

module.exports = { mapSessionStatus };
