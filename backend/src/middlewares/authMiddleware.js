const jwt = require('jsonwebtoken');
const getDb = require('../config/db');

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthenticated.',
      });
    }

    const token = authorization.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = await getDb();

    const user = await db.get(
      `
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        message: 'Unauthenticated.',
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthenticated.',
    });
  }
}

module.exports = authMiddleware;