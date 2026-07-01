const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const skillResource = require('../../resources/skillResource');
const { uploadSkillIcon } = require('../../middlewares/uploadMiddleware');
const { deletePublicFile } = require('../../utils/storage');
const { toBoolean } = require('../../utils/boolean');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getUploadedRelativePath(folder, file) {
  if (!file) {
    return null;
  }

  return `${folder}/${file.filename}`;
}

function handleUploadError(error, req, res, next) {
  if (!error) {
    return next();
  }

  return res.status(422).json({
    message: error.message || 'Upload failed',
  });
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

async function categoryExists(db, categoryId) {
  const category = await db.get(
    `
      SELECT id
      FROM skill_categories
      WHERE id = ?
      LIMIT 1
    `,
    [categoryId]
  );

  return Boolean(category);
}

router.post(
  '/',
  (req, res, next) => {
    uploadSkillIcon.single('icon')(req, res, (error) => {
      handleUploadError(error, req, res, next);
    });
  },
  async (req, res) => {
    const db = await getDb();

    const { skill_category_id, name, level = 'intermediate', order, is_active = true } = req.body;

    if (!skill_category_id || !name) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: {
          ...(!skill_category_id
            ? { skill_category_id: ['The skill category field is required.'] }
            : {}),
          ...(!name ? { name: ['The name field is required.'] } : {}),
        },
      });
    }

    if (!(await categoryExists(db, skill_category_id))) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: {
          skill_category_id: ['The selected skill category is invalid.'],
        },
      });
    }

    const timestamp = now();
    const uploadedIconPath = getUploadedRelativePath('skills', req.file);

    const maxOrderRow = await db.get(
      `
        SELECT COALESCE(MAX("order"), -1) AS max_order
        FROM skills
        WHERE skill_category_id = ?
      `,
      [skill_category_id]
    );

    const finalOrder = hasValue(order)
      ? normalizeOrder(order, 0)
      : Number(maxOrderRow.max_order) + 1;

    const result = await db.run(
      `
        INSERT INTO skills (
          skill_category_id,
          name,
          icon,
          level,
          "order",
          is_active,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `,
      [
        skill_category_id,
        name,
        uploadedIconPath,
        level,
        finalOrder,
        toBoolean(is_active),
        timestamp,
        timestamp,
      ]
    );

    const skill = await db.get(
      `
        SELECT *
        FROM skills
        WHERE id = ?
      `,
      [result.lastID]
    );

    return res.status(201).json({
      message: 'Skill created successfully',
      data: skillResource(skill),
    });
  }
);

router.put(
  '/:id',
  (req, res, next) => {
    uploadSkillIcon.single('icon')(req, res, (error) => {
      handleUploadError(error, req, res, next);
    });
  },
  async (req, res) => {
    const db = await getDb();

    const existingSkill = await db.get(
      `
        SELECT *
        FROM skills
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!existingSkill) {
      return res.status(404).json({
        message: 'Skill not found',
      });
    }

    const { skill_category_id, name, level, order, is_active } = req.body;

    if (!skill_category_id || !name) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: {
          ...(!skill_category_id
            ? { skill_category_id: ['The skill category field is required.'] }
            : {}),
          ...(!name ? { name: ['The name field is required.'] } : {}),
        },
      });
    }

    if (!(await categoryExists(db, skill_category_id))) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: {
          skill_category_id: ['The selected skill category is invalid.'],
        },
      });
    }

    let finalOrder = normalizeOrder(order, Number(existingSkill.order) || 0);

    if (!hasValue(order) && Number(skill_category_id) !== Number(existingSkill.skill_category_id)) {
      const maxOrderRow = await db.get(
        `
          SELECT COALESCE(MAX("order"), -1) AS max_order
          FROM skills
          WHERE skill_category_id = ?
        `,
        [skill_category_id]
      );

      finalOrder = Number(maxOrderRow.max_order) + 1;
    }

    const finalLevel = hasValue(level) ? level : existingSkill.level;

    const finalIsActive = hasValue(is_active)
      ? toBoolean(is_active)
      : Number(existingSkill.is_active) || 0;

    const timestamp = now();
    const uploadedIconPath = getUploadedRelativePath('skills', req.file);

    // Delete old icon if new one uploaded
    if (uploadedIconPath && existingSkill.icon) {
      deletePublicFile(existingSkill.icon);
    }

    await db.run(
      `
        UPDATE skills
        SET
          skill_category_id = ?,
          name = ?,
          icon = COALESCE(?, icon),
          level = ?,
          "order" = ?,
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [
        skill_category_id,
        name,
        uploadedIconPath,
        finalLevel,
        finalOrder,
        finalIsActive,
        timestamp,
        req.params.id,
      ]
    );

    const updatedSkill = await db.get(
      `
        SELECT *
        FROM skills
        WHERE id = ?
      `,
      [req.params.id]
    );

    return res.json({
      message: 'Skill updated successfully',
      data: skillResource(updatedSkill),
    });
  }
);

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const existingSkill = await db.get(
    `
      SELECT *
      FROM skills
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingSkill) {
    return res.status(404).json({
      message: 'Skill not found',
    });
  }

  await db.run(
    `
      DELETE FROM skills
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Skill deleted successfully',
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
            UPDATE skills
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
      message: 'Failed to reorder skills',
    });
  }

  const skills = await db.all(`
    SELECT *
    FROM skills
    ORDER BY "order" ASC, id ASC
  `);

  return res.json({
    message: 'Skills reordered successfully',
    data: skills.map(skillResource),
  });
});

module.exports = router;
