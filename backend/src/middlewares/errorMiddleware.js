function errorMiddleware(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;

  const response = {
    message: error.message || 'Internal server error',
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorMiddleware;