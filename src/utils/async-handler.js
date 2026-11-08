// Bungkus async route handler supaya rejection masuk ke error middleware Express.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
