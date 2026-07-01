const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const skillCategoryResource = require('../../resources/skillCategoryResource');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function normalizeOrder(value, fallback = 0) {
  if (!hasValue(value)) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

router.post('/', async (req, res) => {
  const db = await getDb();

  const { name, order } = req.body;

  if (!name) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        name: ['The name field is required.'],
      },
    });
  }

  const timestamp = now();

  const maxOrderRow = await db.get(`
    SELECT COALESCE(MAX("order"), -1) AS max_order
    FROM skill_categories
  `);

  const finalOrder = hasValue(order) ? normalizeOrder(order, 0) : Number(maxOrderRow.max_order) + 1;

  const result = await db.run(
    `
      INSERT INTO skill_categories (
        name,
        "order",
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?)
      RETURNING id
    `,
    [name, finalOrder, timestamp, timestamp]
  );

  const category = await db.get(
    `
      SELECT *
      FROM skill_categories
      WHERE id = ?
    `,
    [result.lastID]
  );

  return res.status(201).json({
    message: 'Skill category created successfully',
    data: skillCategoryResource({ ...category, skills: [] }),
  });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();

  const existingCategory = await db.get(
    `
      SELECT *
      FROM skill_categories
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingCategory) {
    return res.status(404).json({
      message: 'Skill category not found',
    });
  }

  const { name, order } = req.body;

  if (!name) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        name: ['The name field is required.'],
      },
    });
  }

  const finalOrder = normalizeOrder(order, Number(existingCategory.order) || 0);

  await db.run(
    `
      UPDATE skill_categories
      SET
        name = ?,
        "order" = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [name, finalOrder, now(), req.params.id]
  );

  const updatedCategory = await db.get(
    `
      SELECT *
      FROM skill_categories
      WHERE id = ?
    `,
    [req.params.id]
  );

  const skills = await db.all(
    `
      SELECT *
      FROM skills
      WHERE skill_category_id = ?
      ORDER BY "order" ASC, id ASC
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Skill category updated successfully',
    data: skillCategoryResource({ ...updatedCategory, skills }),
  });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const existingCategory = await db.get(
    `
      SELECT *
      FROM skill_categories
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingCategory) {
    return res.status(404).json({
      message: 'Skill category not found',
    });
  }

  await db.run(
    `
      DELETE FROM skill_categories
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Skill category deleted successfully',
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
            UPDATE skill_categories
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
      message: 'Failed to reorder skill categories',
    });
  }

  const categories = await db.all(`
    SELECT *
    FROM skill_categories
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    message: 'Skill categories reordered successfully',
    data: categories.map((category) => skillCategoryResource({ ...category, skills: [] })),
  });
});

module.exports = router;
