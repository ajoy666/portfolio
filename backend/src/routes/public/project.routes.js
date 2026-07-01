const express = require('express');
const getDb = require('../../config/db');
const projectResource = require('../../resources/projectResource');

const router = express.Router();

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

router.get('/', async (req, res) => {
  const db = await getDb();

  const projects = await db.all(`
    SELECT p.*, parent.title AS parent_title, parent.slug AS parent_slug
    FROM projects p
    LEFT JOIN projects parent ON parent.id = p.parent_id
    WHERE p.status = 'published'
    ORDER BY p."order" ASC, p.id DESC
  `);

  const projectsWithScreenshots = await attachScreenshots(db, projects);

  return res.json({
    data: projectsWithScreenshots.map(projectResource),
  });
});

router.get('/:slug', async (req, res) => {
  const db = await getDb();

  const project = await db.get(
    `
      SELECT p.*, parent.title AS parent_title, parent.slug AS parent_slug
      FROM projects p
      LEFT JOIN projects parent ON parent.id = p.parent_id
      WHERE p.slug = ?
        AND p.status = 'published'
      LIMIT 1
    `,
    [req.params.slug]
  );

  if (!project) {
    return res.status(404).json({
      message: 'Project not found',
    });
  }

  const [projectWithScreenshots] = await attachScreenshots(db, [project]);

  return res.json({
    data: projectResource(projectWithScreenshots),
  });
});

module.exports = router;
