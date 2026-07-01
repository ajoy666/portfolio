function asyncHandler(callback) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(callback(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;