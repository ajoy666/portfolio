const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const experienceResource = require('../../resources/experienceResource');
const cvGenerator = require('../../utils/cvGenerator');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function triggerCvRegen() {
  cvGenerator
    .generate()
    .catch((err) => console.error('[cvGenerator] Background regen failed:', err));
}

// GET /admin/experiences
router.get('/', async (req, res) => {
  const db = await getDb();

  const experiences = await db.all(`
    SELECT * FROM experiences
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    data: experiences.map(experienceResource),
  });
});

// POST /admin/experiences
router.post('/', async (req, res) => {
  const db = await getDb();

  const {
    company,
    role,
    type = null,
    location = null,
    start_date,
    end_date = null,
    description = null,
    is_active = true,
    order,
  } = req.body;

  if (!company || !role || !start_date) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!company ? { company: ['The company field is required.'] } : {}),
        ...(!role ? { role: ['The role field is required.'] } : {}),
        ...(!start_date ? { start_date: ['The start date field is required.'] } : {}),
      },
    });
  }

  const VALID_TYPES = ['Full Time', 'Part Time', 'Freelance', 'Intern', 'Contract'];

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: { type: [`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`] },
    });
  }

  const maxOrderRow = await db.get(`
    SELECT COALESCE(MAX("order"), -1) AS max_order FROM experiences
  `);

  const finalOrder =
    order === undefined || order === null || order === ''
      ? Number(maxOrderRow.max_order) + 1
      : Number(order);

  const timestamp = now();

  const result = await db.run(
    `INSERT INTO experiences
      (company, role, type, location, start_date, end_date, description, is_active, "order", created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      company,
      role,
      type,
      location,
      start_date,
      end_date || null,
      description,
      is_active === false ? false : true,
      finalOrder,
      timestamp,
      timestamp,
    ]
  );

  const created = await db.get('SELECT * FROM experiences WHERE id = ?', [result.lastID]);

  triggerCvRegen();

  return res.status(201).json({
    message: 'Experience created successfully',
    data: experienceResource(created),
  });
});

// PUT /admin/experiences/:id
router.put('/:id', async (req, res) => {
  const db = await getDb();

  const existing = await db.get('SELECT * FROM experiences WHERE id = ? LIMIT 1', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ message: 'Experience not found' });
  }

  const {
    company,
    role,
    type = null,
    location = null,
    start_date,
    end_date = null,
    description = null,
    is_active,
    order,
  } = req.body;

  if (!company || !role || !start_date) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!company ? { company: ['The company field is required.'] } : {}),
        ...(!role ? { role: ['The role field is required.'] } : {}),
        ...(!start_date ? { start_date: ['The start date field is required.'] } : {}),
      },
    });
  }

  const VALID_TYPES = ['Full Time', 'Part Time', 'Freelance', 'Intern', 'Contract'];

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: { type: [`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`] },
    });
  }

  const finalOrder =
    order === undefined || order === null || order === ''
      ? Number(existing.order) || 0
      : Number(order);

  const finalIsActive =
    is_active === undefined
      ? existing.is_active
      : is_active === true || is_active === 'true' || is_active === 1;

  await db.run(
    `UPDATE experiences
     SET company = ?, role = ?, type = ?, location = ?,
         start_date = ?, end_date = ?, description = ?,
         is_active = ?, "order" = ?, updated_at = ?
     WHERE id = ?`,
    [
      company,
      role,
      type,
      location,
      start_date,
      end_date || null,
      description,
      finalIsActive,
      finalOrder,
      now(),
      req.params.id,
    ]
  );

  const updated = await db.get('SELECT * FROM experiences WHERE id = ?', [req.params.id]);

  triggerCvRegen();

  return res.json({
    message: 'Experience updated successfully',
    data: experienceResource(updated),
  });
});

// DELETE /admin/experiences/:id
router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const existing = await db.get('SELECT * FROM experiences WHERE id = ? LIMIT 1', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ message: 'Experience not found' });
  }

  await db.run('DELETE FROM experiences WHERE id = ?', [req.params.id]);

  triggerCvRegen();

  return res.json({ message: 'Experience deleted successfully' });
});

// PATCH /admin/experiences/reorder
router.patch('/reorder', async (req, res) => {
  const db = await getDb();

  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: { items: ['The items field must be an array.'] },
    });
  }

  const timestamp = now();

  try {
    await db.transaction(async (trx) => {
      for (const item of items) {
        await trx.run(`UPDATE experiences SET "order" = ?, updated_at = ? WHERE id = ?`, [
          Number(item.order) || 0,
          timestamp,
          item.id,
        ]);
      }
    });
  } catch {
    return res.status(500).json({ message: 'Failed to reorder experiences' });
  }

  const experiences = await db.all(`
    SELECT * FROM experiences ORDER BY "order" ASC, id ASC
  `);

  triggerCvRegen();

  return res.json({
    message: 'Experiences reordered successfully',
    data: experiences.map(experienceResource),
  });
});

module.exports = router;
