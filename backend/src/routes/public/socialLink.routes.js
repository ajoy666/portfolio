const express = require('express');
const getDb = require('../../config/db');
const socialLinkResource = require('../../resources/socialLinkResource');

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await getDb();

  const socialLinks = await db.all(`
    SELECT *
    FROM social_links
    WHERE is_active = true
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    data: socialLinks.map(socialLinkResource),
  });
});

module.exports = router;
