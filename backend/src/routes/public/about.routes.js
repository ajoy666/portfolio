const express = require('express');
const getDb = require('../../config/db');
const aboutResource = require('../../resources/aboutResource');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();

  const about = await db.get(`
    SELECT *
    FROM abouts
    ORDER BY id ASC
    LIMIT 1
  `);

  return res.json({
    data: aboutResource(about),
  });
});

module.exports = router;
