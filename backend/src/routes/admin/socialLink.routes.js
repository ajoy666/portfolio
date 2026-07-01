const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const socialLinkResource = require('../../resources/socialLinkResource');
const { toBoolean } = require('../../utils/boolean');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/', async (req, res) => {
  const db = await getDb();

  const socialLinks = await db.all(`
    SELECT *
    FROM social_links
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    data: socialLinks.map(socialLinkResource),
  });
});

router.post('/', async (req, res) => {
  const db = await getDb();

  const { platform, label, url, icon, is_active = true, order = 0 } = req.body;

  if (!platform || !label || !url) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!platform ? { platform: ['The platform field is required.'] } : {}),
        ...(!label ? { label: ['The label field is required.'] } : {}),
        ...(!url ? { url: ['The url field is required.'] } : {}),
      },
    });
  }

  const timestamp = now();

  const result = await db.run(
    `
        INSERT INTO social_links (
        platform,
        label,
        url,
        icon,
        is_active,
        "order",
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
    `,
    [
      platform,
      label,
      url,
      icon || null,
      toBoolean(is_active),
      Number(order) || 0,
      timestamp,
      timestamp,
    ]
  );

  const socialLink = await db.get(
    `
      SELECT *
      FROM social_links
      WHERE id = ?
    `,
    [result.lastID]
  );

  return res.status(201).json({
    message: 'Social link created successfully',
    data: socialLinkResource(socialLink),
  });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();

  const existingSocialLink = await db.get(
    `
      SELECT *
      FROM social_links
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingSocialLink) {
    return res.status(404).json({
      message: 'Social link not found',
    });
  }

  const { platform, label, url, icon, is_active, order } = req.body;

  if (!platform || !label || !url) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!platform ? { platform: ['The platform field is required.'] } : {}),
        ...(!label ? { label: ['The label field is required.'] } : {}),
        ...(!url ? { url: ['The url field is required.'] } : {}),
      },
    });
  }

  const timestamp = now();

  await db.run(
    `
        UPDATE social_links
        SET
        platform = ?,
        label = ?,
        url = ?,
        icon = ?,
        is_active = ?,
        "order" = ?,
        updated_at = ?
        WHERE id = ?
    `,
    [
      platform,
      label,
      url,
      icon || null,
      toBoolean(is_active),
      Number(order) || 0,
      timestamp,
      req.params.id,
    ]
  );

  const updatedSocialLink = await db.get(
    `
      SELECT *
      FROM social_links
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Social link updated successfully',
    data: socialLinkResource(updatedSocialLink),
  });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const existingSocialLink = await db.get(
    `
      SELECT *
      FROM social_links
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingSocialLink) {
    return res.status(404).json({
      message: 'Social link not found',
    });
  }

  await db.run(
    `
      DELETE FROM social_links
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Social link deleted successfully',
  });
});

router.patch('/reorder', async (req, res) => {
  const db = await getDb();

  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        items: ['The items field must be an array.'],
      },
    });
  }

  const timestamp = now();

  try {
    await db.transaction(async (trx) => {
      for (const item of items) {
        await trx.run(
          `
            UPDATE social_links
            SET
              "order" = ?,
              updated_at = ?
            WHERE id = ?
          `,
          [Number(item.order) || 0, timestamp, item.id]
        );
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reorder social links',
    });
  }
  const socialLinks = await db.all(`
    SELECT *
    FROM social_links
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    message: 'Social links reordered successfully',
    data: socialLinks.map(socialLinkResource),
  });
});

module.exports = router;
