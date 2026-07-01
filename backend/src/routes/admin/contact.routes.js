const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const contactResource = require('../../resources/contactResource');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/', async (req, res) => {
  const db = await getDb();

  const contacts = await db.all(`
    SELECT *
    FROM contacts
    ORDER BY
      CASE status
        WHEN 'unread' THEN 0
        WHEN 'read' THEN 1
        WHEN 'replied' THEN 2
        ELSE 3
      END,
      created_at DESC
  `);

  return res.json({
    data: contacts.map(contactResource),
  });
});

router.get('/:id', async (req, res) => {
  const db = await getDb();

  const contact = await db.get(
    `
      SELECT *
      FROM contacts
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!contact) {
    return res.status(404).json({
      message: 'Contact not found',
    });
  }

  return res.json({
    data: contactResource(contact),
  });
});

router.patch('/:id/status', async (req, res) => {
  const db = await getDb();

  const { status } = req.body;

  const allowedStatuses = ['unread', 'read', 'replied'];

  if (!allowedStatuses.includes(status)) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        status: ['The selected status is invalid.'],
      },
    });
  }

  const contact = await db.get(
    `
      SELECT *
      FROM contacts
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!contact) {
    return res.status(404).json({
      message: 'Contact not found',
    });
  }

  const timestamp = now();

  await db.run(
    `
      UPDATE contacts
      SET
        status = ?,
        read_at = CASE
          WHEN ? = 'read' AND read_at IS NULL THEN ?
          ELSE read_at
        END,
        updated_at = ?
      WHERE id = ?
    `,
    [status, status, timestamp, timestamp, req.params.id]
  );

  const updatedContact = await db.get(
    `
      SELECT *
      FROM contacts
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Contact status updated successfully',
    data: contactResource(updatedContact),
  });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const contact = await db.get(
    `
      SELECT *
      FROM contacts
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!contact) {
    return res.status(404).json({
      message: 'Contact not found',
    });
  }

  await db.run(
    `
      DELETE FROM contacts
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Contact deleted successfully',
  });
});

module.exports = router;
