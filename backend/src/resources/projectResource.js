const assetUrl = require('../utils/assetUrl');
const projectScreenshotResource = require('./projectScreenshotResource');

function parseTechStack(value) {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function projectResource(project) {
  const screenshots = project.screenshots || [];
  const thumbnail = screenshots.find((screenshot) => Number(screenshot.is_thumbnail) === 1);

  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    short_description: project.short_description,
    description: project.description,

    tech_stack: parseTechStack(project.tech_stack),
    technologies: parseTechStack(project.tech_stack),

    demo_url: project.demo_url,
    repo_url: project.repo_url,
    github_url: project.repo_url,

    status: project.status,
    is_featured: Boolean(project.is_featured),
    is_active: project.status === 'published',

    parent_id: project.parent_id ?? null,
    parent: project.parent_id
      ? {
          id: project.parent_id,
          title: project.parent_title ?? null,
          slug: project.parent_slug ?? null,
        }
      : null,

    thumbnail_url: thumbnail?.file_path ? assetUrl(thumbnail.file_path) : null,
    screenshots: screenshots.map(projectScreenshotResource),

    order: project.order,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

module.exports = projectResource;
