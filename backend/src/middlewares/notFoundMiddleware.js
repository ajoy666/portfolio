function notFoundMiddleware(req, res, next) {
  return res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

module.exports = notFoundMiddleware;