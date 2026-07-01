const express = require('express');
const getDb = require('../../config/db');
const contactResource = require('../../resources/contactResource');

const router = express.Router();

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function cleanErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value !== undefined));
}

router.post('/', async (req, res) => {
  const db = await getDb();

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: cleanErrors({
        name: !name ? ['The name field is required.'] : undefined,
        email: !email ? ['The email field is required.'] : undefined,
        message: !message ? ['The message field is required.'] : undefined,
      }),
    });
  }

  const timestamp = now();

  const result = await db.run(
    `
      INSERT INTO contacts (
        name,
        email,
        subject,
        message,
        status,
        read_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `,
    [name, email, subject || null, message, 'unread', null, timestamp, timestamp]
  );

  const contact = await db.get(
    `
      SELECT *
      FROM contacts
      WHERE id = ?
    `,
    [result.lastID]
  );

  return res.status(201).json({
    message: 'Message sent successfully',
    data: contactResource(contact),
  });
});

module.exports = router;
