const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes'); 
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const AppError = require('./utils/AppError');
const asyncHandler = require('./utils/asyncHandler');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.WEB_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/storage', express.static(path.join(process.cwd(), 'storage/app/public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio Express API is running',
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Portfolio API v1 is running',
  });
});

app.use('/api/v1', routes);

app.get(
  '/api/v1/debug/error',
  asyncHandler(async (req, res) => {
    throw new AppError('Testing error handler', 500);
  })
);

app.get(
  '/api/v1/debug/validation-error',
  asyncHandler(async (req, res) => {
    throw new AppError('Validation failed', 422, {
      name: ['The name field is required.'],
      email: ['The email field is required.'],
    });
  })
);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
