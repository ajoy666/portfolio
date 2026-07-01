const express = require('express');
const getDb = require('../../config/db');
const authMiddleware = require('../../middlewares/authMiddleware');
const projectResource = require('../../resources/projectResource');
const projectScreenshotResource = require('../../resources/projectScreenshotResource');
const makeSlug = require('../../utils/slug');
const { uploadProjectScreenshot } = require('../../middlewares/uploadMiddleware');
const { deletePublicFile } = require('../../utils/storage');
const { toBoolean } = require('../../utils/boolean');

const router = express.Router();

router.use(authMiddleware);

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeTechStack(value) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }

    return JSON.stringify([value]);
  } catch (error) {
    return JSON.stringify(
      String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
}

function normalizeParentId(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
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

async function attachScreenshots(db, projects) {
  if (!projects.length) {
    return projects;
  }

  const projectIds = projects.map((project) => project.id);
  const placeholders = projectIds.map(() => '?').join(',');

  const screenshots = await db.all(
    `
      SELECT *
      FROM project_screenshots
      WHERE project_id IN (${placeholders})
      ORDER BY "order" ASC, id ASC
    `,
    projectIds
  );

  return projects.map((project) => ({
    ...project,
    screenshots: screenshots.filter((screenshot) => screenshot.project_id === project.id),
  }));
}

async function getProjectWithScreenshots(db, id) {
  const project = await db.get(
    `
      SELECT p.*, parent.title AS parent_title, parent.slug AS parent_slug
      FROM projects p
      LEFT JOIN projects parent ON parent.id = p.parent_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [id]
  );

  if (!project) {
    return null;
  }

  const [projectWithScreenshots] = await attachScreenshots(db, [project]);

  return projectWithScreenshots;
}

router.get('/', async (req, res) => {
  const db = await getDb();

  const projects = await db.all(`
    SELECT p.*, parent.title AS parent_title, parent.slug AS parent_slug
    FROM projects p
    LEFT JOIN projects parent ON parent.id = p.parent_id
    ORDER BY p."order" ASC, p.id DESC
  `);

  const projectsWithScreenshots = await attachScreenshots(db, projects);

  return res.json({
    data: projectsWithScreenshots.map(projectResource),
  });
});

router.post('/', async (req, res) => {
  const db = await getDb();

  const {
    title,
    slug,
    short_description,
    description = null,
    tech_stack = null,
    demo_url = null,
    repo_url = null,
    status = 'draft',
    is_featured = false,
    parent_id = null,
    order,
  } = req.body;

  if (!title || !short_description) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!title ? { title: ['The title field is required.'] } : {}),
        ...(!short_description
          ? { short_description: ['The short description field is required.'] }
          : {}),
      },
    });
  }

  const finalParentId = normalizeParentId(parent_id);

  if (finalParentId !== null) {
    const parentProject = await db.get('SELECT id FROM projects WHERE id = ? LIMIT 1', [
      finalParentId,
    ]);

    if (!parentProject) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: { parent_id: ['The selected parent project does not exist.'] },
      });
    }
  }

  const finalSlug = slug ? makeSlug(slug) : makeSlug(title);

  const existingSlug = await db.get(
    `
      SELECT id
      FROM projects
      WHERE slug = ?
      LIMIT 1
    `,
    [finalSlug]
  );

  if (existingSlug) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        slug: ['The slug has already been taken.'],
      },
    });
  }

  const timestamp = now();

  const maxOrderRow = await db.get(`
    SELECT COALESCE(MAX("order"), -1) AS max_order
    FROM projects
  `);

  const finalOrder =
    order === undefined || order === null || order === ''
      ? Number(maxOrderRow.max_order) + 1
      : Number(order);

  const result = await db.run(
    `
      INSERT INTO projects (
        title,
        slug,
        short_description,
        description,
        tech_stack,
        demo_url,
        repo_url,
        status,
        is_featured,
        parent_id,
        "order",
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `,
    [
      title,
      finalSlug,
      short_description,
      description,
      normalizeTechStack(tech_stack),
      demo_url,
      repo_url,
      status,
      toBoolean(is_featured),
      finalParentId,
      Number.isFinite(finalOrder) ? finalOrder : 0,
      timestamp,
      timestamp,
    ]
  );

  const project = await getProjectWithScreenshots(db, result.lastID);

  return res.status(201).json({
    message: 'Project created successfully',
    data: projectResource(project),
  });
});

router.put('/:id', async (req, res) => {
  const db = await getDb();

  const existingProject = await db.get(
    `
      SELECT *
      FROM projects
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!existingProject) {
    return res.status(404).json({
      message: 'Project not found',
    });
  }

  const {
    title,
    slug,
    short_description,
    description = null,
    tech_stack = null,
    demo_url = null,
    repo_url = null,
    status = 'draft',
    is_featured,
    parent_id,
    order,
  } = req.body;

  if (!title || !short_description) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        ...(!title ? { title: ['The title field is required.'] } : {}),
        ...(!short_description
          ? { short_description: ['The short description field is required.'] }
          : {}),
      },
    });
  }

  const finalParentId =
    parent_id === undefined ? (existingProject.parent_id ?? null) : normalizeParentId(parent_id);

  if (finalParentId !== null) {
    if (finalParentId === Number(req.params.id)) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: { parent_id: ['A project cannot be its own parent.'] },
      });
    }

    const parentProject = await db.get('SELECT id FROM projects WHERE id = ? LIMIT 1', [
      finalParentId,
    ]);

    if (!parentProject) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: { parent_id: ['The selected parent project does not exist.'] },
      });
    }
  }

  const finalSlug = slug ? makeSlug(slug) : makeSlug(title);

  const existingSlug = await db.get(
    `
      SELECT id
      FROM projects
      WHERE slug = ?
        AND id != ?
      LIMIT 1
    `,
    [finalSlug, req.params.id]
  );

  if (existingSlug) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: {
        slug: ['The slug has already been taken.'],
      },
    });
  }

  const finalOrder =
    order === undefined || order === null || order === ''
      ? Number(existingProject.order) || 0
      : Number(order);

  const finalIsFeatured =
    is_featured === undefined || is_featured === null || is_featured === ''
      ? Number(existingProject.is_featured) || 0
      : toBoolean(is_featured);

  await db.run(
    `
      UPDATE projects
      SET
        title = ?,
        slug = ?,
        short_description = ?,
        description = ?,
        tech_stack = ?,
        demo_url = ?,
        repo_url = ?,
        status = ?,
        is_featured = ?,
        parent_id = ?,
        "order" = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [
      title,
      finalSlug,
      short_description,
      description,
      normalizeTechStack(tech_stack),
      demo_url,
      repo_url,
      status,
      finalIsFeatured,
      finalParentId,
      Number.isFinite(finalOrder) ? finalOrder : Number(existingProject.order) || 0,
      now(),
      req.params.id,
    ]
  );

  const project = await getProjectWithScreenshots(db, req.params.id);

  return res.json({
    message: 'Project updated successfully',
    data: projectResource(project),
  });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();

  const project = await getProjectWithScreenshots(db, req.params.id);

  if (!project) {
    return res.status(404).json({
      message: 'Project not found',
    });
  }

  for (const screenshot of project.screenshots || []) {
    deletePublicFile(screenshot.file_path);
  }

  await db.run(
    `
      DELETE FROM projects
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Project deleted successfully',
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
        const orderValue = Number(item.order) || 0;
        const featuredValue = orderValue < 3;

        await trx.run(
          `
            UPDATE projects
            SET
              "order" = ?,
              is_featured = ?,
              updated_at = ?
            WHERE id = ?
          `,
          [orderValue, featuredValue, timestamp, item.id]
        );
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reorder projects',
    });
  }

  const projects = await db.all(`
    SELECT *
    FROM projects
    ORDER BY "order" ASC, id DESC
  `);

  const projectsWithScreenshots = await attachScreenshots(db, projects);

  return res.json({
    message: 'Projects reordered successfully',
    data: projectsWithScreenshots.map(projectResource),
  });
});

router.post(
  '/:id/screenshots',
  (req, res, next) => {
    uploadProjectScreenshot.single('screenshot')(req, res, (error) => {
      handleUploadError(error, req, res, next);
    });
  },
  async (req, res) => {
    const db = await getDb();

    const project = await db.get(
      `
        SELECT *
        FROM projects
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
      });
    }

    if (!req.file) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: {
          screenshot: ['The screenshot field is required.'],
        },
      });
    }

    const { caption = null, is_thumbnail = false, order = 0 } = req.body;

    const timestamp = now();
    const filePath = getUploadedRelativePath('projects', req.file);
    const thumbnailValue = toBoolean(is_thumbnail);

    let result;

    try {
      result = await db.transaction(async (trx) => {
        if (thumbnailValue) {
          await trx.run(
            `
              UPDATE project_screenshots
              SET
                is_thumbnail = false,
                updated_at = ?
              WHERE project_id = ?
            `,
            [timestamp, req.params.id]
          );
        }

        return trx.run(
          `
            INSERT INTO project_screenshots (
              project_id,
              file_path,
              original_name,
              caption,
              is_thumbnail,
              "order",
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
          `,
          [
            req.params.id,
            filePath,
            req.file.originalname,
            caption,
            thumbnailValue,
            Number(order) || 0,
            timestamp,
            timestamp,
          ]
        );
      });

      const screenshot = await db.get(
        `
          SELECT *
          FROM project_screenshots
          WHERE id = ?
        `,
        [result.lastID]
      );

      return res.status(201).json({
        message: 'Project screenshot uploaded successfully',
        data: projectScreenshotResource(screenshot),
      });
    } catch (error) {
      deletePublicFile(filePath);

      return res.status(500).json({
        message: 'Failed to upload project screenshot',
      });
    }
  }
);

router.patch('/:id/screenshots/reorder', async (req, res) => {
  const db = await getDb();

  const project = await db.get(
    `
      SELECT *
      FROM projects
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!project) {
    return res.status(404).json({
      message: 'Project not found',
    });
  }

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
            UPDATE project_screenshots
            SET
              "order" = ?,
              updated_at = ?
            WHERE id = ?
              AND project_id = ?
          `,
          [Number(item.order) || 0, timestamp, item.id, req.params.id]
        );
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reorder project screenshots',
    });
  }

  const screenshots = await db.all(
    `
      SELECT *
      FROM project_screenshots
      WHERE project_id = ?
      ORDER BY "order" ASC, id ASC
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Project screenshots reordered successfully',
    data: screenshots.map(projectScreenshotResource),
  });
});

router.patch('/screenshots/:id/thumbnail', async (req, res) => {
  const db = await getDb();

  const screenshot = await db.get(
    `
      SELECT *
      FROM project_screenshots
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!screenshot) {
    return res.status(404).json({
      message: 'Screenshot not found',
    });
  }

  const timestamp = now();

  try {
    await db.transaction(async (trx) => {
      await trx.run(
        `
          UPDATE project_screenshots
          SET
            is_thumbnail = false,
            updated_at = ?
          WHERE project_id = ?
        `,
        [timestamp, screenshot.project_id]
      );

      await trx.run(
        `
          UPDATE project_screenshots
          SET
            is_thumbnail = true,
            updated_at = ?
          WHERE id = ?
        `,
        [timestamp, req.params.id]
      );
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to set thumbnail',
    });
  }

  const updatedScreenshot = await db.get(
    `
      SELECT *
      FROM project_screenshots
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Thumbnail updated successfully',
    data: projectScreenshotResource(updatedScreenshot),
  });
});

router.delete('/screenshots/:id', async (req, res) => {
  const db = await getDb();

  const screenshot = await db.get(
    `
      SELECT *
      FROM project_screenshots
      WHERE id = ?
      LIMIT 1
    `,
    [req.params.id]
  );

  if (!screenshot) {
    return res.status(404).json({
      message: 'Screenshot not found',
    });
  }

  deletePublicFile(screenshot.file_path);

  await db.run(
    `
      DELETE FROM project_screenshots
      WHERE id = ?
    `,
    [req.params.id]
  );

  return res.json({
    message: 'Project screenshot deleted successfully',
  });
});

module.exports = router;
