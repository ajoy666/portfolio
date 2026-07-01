const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const getDb = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const userResource = require('../resources/userResource');

const router = express.Router();

router.post('/login', async (req, res) => {
  const db = await getDb();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!email ? { email: ['The email field is required.'] } : {}),
        ...(!password ? { password: ['The password field is required.'] } : {}),
      },
    });
  }

  const user = await db.get(
    `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  if (!user) {
    return res.status(401).json({
      message: 'Invalid credentials',
    });
  }

    const normalizedPasswordHash = user.password.replace(/^\$2y\$/, '$2b$');

    const isPasswordValid = await bcrypt.compare(password, normalizedPasswordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: 'Invalid credentials',
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );

  return res.status(200).json({
    message: 'Login successful',
    token,
    token_type: 'Bearer',
    user: userResource(user),
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  return res.status(200).json({
    user: userResource(req.user),
  });
});

router.post('/logout', authMiddleware, async (req, res) => {
  return res.json({
    message: 'Logout successful',
  });
});

module.exports = router;